import { type ClientError, type ErrorArgs, toClientError } from "./errors.ts";
import { EventEmitter, type EventEmitterOptions } from "./events.ts";
import { Hooks } from "./hooks.ts";
import { escapeTagValue, Parser, type Raw } from "./parsers.ts";
import { loadPlugins, type Plugin } from "./plugins.ts";
import {
  type AnyCommand,
  type AnyError,
  type AnyRawCommand,
  type AnyReply,
  PROTOCOL,
} from "./protocol.ts";
import type { Conn, Runtime } from "../runtime/types.ts";
import { getRuntime } from "../runtime/mod.ts";

type AnyRawEventName = `raw:${AnyCommand | AnyReply | AnyError}`;

/** Describes the base feature set (options, events, state, utils) of the core IRC client. */
export interface CoreFeatures {
  options: EventEmitterOptions & {
    /** Size of the buffer that receives data from server.
     *
     * Default to `4096` bytes. */
    bufferSize?: number;
  };

  events: {
    "connecting": PublicAddr;
    "connected": PublicAddr;
    "disconnected": PublicAddr;
    "error": ClientError;
    "raw": Raw; // never be emitted, but using it will generate all raw events
  } & { [K in AnyRawEventName]: Raw };

  state: {
    remoteAddr: RemoteAddr;
  };

  utils: Record<never, never>;
}

/** Generates an array of `raw:<command>` event names from a protocol category. */
export function generateRawEvents<T extends keyof typeof PROTOCOL>(type: T) {
  type Commands = typeof PROTOCOL[T][keyof typeof PROTOCOL[T]];
  return Object
    .values(PROTOCOL[type])
    .map((command) => `raw:${command}`) as `raw:${Commands & string}`[];
}

const BUFFER_SIZE = 4096;
const PORT = 6667;

/** Options for connecting to an IRC server. TLS fields only available when `tls` is `true`. */
export type ConnectOptions =
  | { tls?: false; port?: number }
  | {
    tls: true;
    port?: number;
    /** PEM client certificate content. */
    cert?: string;
    /** PEM private key content. */
    key?: string;
    /** PEM CA certificate contents. */
    caCerts?: string[];
    /** Path to PEM client certificate file. Alternative to `cert`. */
    certFile?: string;
    /** Path to PEM private key file. Alternative to `key`. */
    keyFile?: string;
    /** Path to PEM CA certificate file. Alternative to `caCerts`. */
    caCertFile?: string;
  };

/** Full network address and connection details of a remote IRC server. */
export interface RemoteAddr {
  hostname: string;
  port: number;
  tls?: boolean;
  cert?: string;
  key?: string;
  caCerts?: string[];
}

/** Network address exposed in events — without sensitive fields (cert/key). */
export type PublicAddr = Omit<RemoteAddr, "cert" | "key">;

/** Low-level IRC client handling TCP connection, raw message parsing, and event dispatching. */
export class CoreClient<
  TEvents extends CoreFeatures["events"] = CoreFeatures["events"],
> extends EventEmitter<TEvents> {
  readonly state: CoreFeatures["state"];
  readonly utils: CoreFeatures["utils"];

  protected runtime: Runtime | null = null;
  protected conn: Conn | null = null;
  protected hooks: Hooks<CoreClient<TEvents>> = new Hooks<CoreClient<TEvents>>(
    this,
  );

  private decoder = new TextDecoder();
  private encoder = new TextEncoder();
  private parser = new Parser();
  private buffer: Uint8Array;

  constructor(
    // deno-lint-ignore no-explicit-any
    plugins: Plugin<any, any>[],
    options: Readonly<CoreFeatures["options"]>,
  ) {
    super(options);

    this.buffer = new Uint8Array(options.bufferSize ?? BUFFER_SIZE);
    this.state = { remoteAddr: { hostname: "", port: 0, tls: false } };
    this.utils = {};

    // The 'raw' event is never emitted. But when the client subscribes to it,
    // it will be translated into ALL available raw events.

    this.createMultiEvent("raw", generateRawEvents("ALL"));

    // When `loadPlugins` is called, plugins can add their own error listeners.
    // In order to keep the default error throwing behavior (at least one error
    // listener is required to handle errors), `memorizeCurrentListenerCounts`
    // should always be called after to ignore already added error listeners.

    loadPlugins(this, options, plugins);
    this.memorizeCurrentListenerCounts();
  }

  /** Connects to a server.
   *
   * Default port to `6667`.
   *
   * Pass `{ tls: true }` to connect using TLS.
   * Pass `{ tls: true, cert, key }` to connect with a client certificate.
   *
   * Resolves when connected. */
  async connect(
    hostname: string,
    options: ConnectOptions = {},
  ): Promise<Conn | null> {
    if (!this.runtime) {
      this.runtime = await getRuntime();
    }

    const { port = PORT } = options;
    const tls = options.tls ?? false;

    let tlsFields: { cert?: string; key?: string; caCerts?: string[] } = {};
    if (options.tls) {
      const cert = options.cert ??
        (options.certFile
          ? this.runtime.readTextFileSync(options.certFile)
          : undefined);
      const key = options.key ??
        (options.keyFile
          ? this.runtime.readTextFileSync(options.keyFile)
          : undefined);
      const caCerts = options.caCerts ??
        (options.caCertFile
          ? [this.runtime.readTextFileSync(options.caCertFile)]
          : undefined);
      tlsFields = {
        ...(cert !== undefined && { cert }),
        ...(key !== undefined && { key }),
        ...(caCerts !== undefined && { caCerts }),
      };
    }

    this.state.remoteAddr = { hostname, port, tls, ...tlsFields };

    if (this.conn !== null) {
      this.close();
    }

    const publicAddr = this.getPublicAddr();
    this.emit("connecting", publicAddr);

    try {
      if (tls) {
        const { cert, key, caCerts } = this.state.remoteAddr;
        this.conn = cert && key
          ? await this.runtime.connectTls({
            hostname,
            port,
            caCerts,
            cert,
            key,
          })
          : await this.runtime.connectTls({ hostname, port, caCerts });
      } else {
        this.conn = await this.runtime.connect({ hostname, port });
      }
      this.emit("connected", publicAddr);
    } catch (error) {
      this.emitError("connect", error);
      return null;
    }

    this.loop(this.conn);

    return this.conn;
  }

  private getPublicAddr(): PublicAddr {
    const { cert: _, key: __, ...publicAddr } = this.state.remoteAddr;
    return publicAddr;
  }

  private async loop(conn: Conn): Promise<void> {
    for (;;) {
      const chunks = await this.read(conn);
      if (chunks === null) break;

      const messageGenerator = this.parser.parseMessages(chunks);

      for (const msg of messageGenerator) {
        this.emit(`raw:${msg.command}`, msg);
      }
    }

    this.close();
  }

  private async read(conn: Conn): Promise<string | null> {
    let read: number | null;

    try {
      read = await conn.read(this.buffer);
      if (read === null) return null;
    } catch (error) {
      this.emitError("read", error);
      return null;
    }

    const bytes = this.buffer.subarray(0, read);
    const chunks = this.decoder.decode(bytes);

    return chunks;
  }

  private close(): void {
    if (this.conn === null) {
      return;
    }

    try {
      this.conn.close();
      this.emit("disconnected", this.getPublicAddr());
    } catch (error) {
      this.emitError("close", error);
    } finally {
      this.conn = null;
    }
  }

  /** Sends a raw message to the server.
   *
   * Resolves with the raw message sent to the server,
   * or `null` if nothing has been sent. */
  async send(
    command: AnyRawCommand,
    ...params: (string | undefined)[]
  ): Promise<string | null>;

  /** Sends a raw message with IRCv3 tags to the server. */
  async send(
    tags: Record<string, string | undefined>,
    command: AnyRawCommand,
    ...params: (string | undefined)[]
  ): Promise<string | null>;

  // deno-lint-ignore no-explicit-any
  async send(first: any, ...rest: any[]): Promise<string | null> {
    let tags: Record<string, string | undefined> | undefined;
    let command: AnyRawCommand;
    let params: (string | undefined)[];

    if (typeof first === "object") {
      tags = first;
      command = rest.shift();
      params = rest;
    } else {
      command = first;
      params = rest;
    }

    if (this.conn === null) {
      this.emitError("write", "Unable to send message", this.send);
      return null;
    }

    // Removes undefined trailing parameters.
    for (let i = params.length - 1; i >= 0; --i) {
      params[i] === undefined ? params.pop() : i = 0;
    }

    // Prefixes trailing parameter with ':'.
    const last = params.length - 1;
    if (
      params.length > 0 &&
      (params[last]?.[0] === ":" || params[last]?.includes(" ", 1))
    ) {
      params[last] = ":" + params[last];
    }

    // Encodes tags prefix.
    let tagStr = "";
    if (tags) {
      tagStr = "@" + Object.entries(tags)
        .map(([k, v]) => v !== undefined ? `${k}=${escapeTagValue(v)}` : k)
        .join(";") +
        " ";
    }

    // Prepares and encodes raw message.
    const raw = tagStr +
      (command + " " + params.join(" ")).trimEnd() + "\r\n";
    const bytes = this.encoder.encode(raw);

    try {
      await this.conn.write(bytes);
      return raw;
    } catch (error) {
      this.emitError("write", error);
      return null;
    }
  }

  /** Disconnects from the server. */
  disconnect(): void {
    this.close();
  }

  /** Emits properly an error. */
  emitError(...args: ErrorArgs): void {
    const [, error] = args;
    if (this.runtime?.isSilentError(error)) {
      return;
    }
    this.emit("error", toClientError(...args));
  }
}

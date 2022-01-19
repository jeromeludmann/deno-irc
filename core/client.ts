import { type ClientError, type ErrorArgs, toClientError } from "./errors.ts";
import { EventEmitter, type EventEmitterOptions } from "./events.ts";
import { Hooks } from "./hooks.ts";
import { Parser, type Raw } from "./parsers.ts";
import { loadPlugins, type Plugin } from "./plugins.ts";
import { type AnyCommand } from "./protocol.ts";

export interface CoreFeatures {
  options: EventEmitterOptions & {
    /** Size of the buffer that receives data from server.
     *
     * Default to `4096` bytes. */
    bufferSize?: number;
  };
  events: {
    "connecting": RemoteAddr;
    "connected": RemoteAddr;
    "disconnected": RemoteAddr;
    "raw": Raw;
    "error": ClientError;
  };
  state: {
    remoteAddr: RemoteAddr;
  };
}

const BUFFER_SIZE = 4096;
const PORT = 6667;

export interface RemoteAddr {
  hostname: string;
  port: number;
  tls?: boolean;
}

/** How to connect to a server */
interface ConnectImpl {
  noTls(opts: Deno.ConnectOptions): Promise<Deno.Conn>;
  withTls(opts: Deno.ConnectTlsOptions): Promise<Deno.Conn>;
}

export class CoreClient<
  TEvents extends CoreFeatures["events"] = CoreFeatures["events"],
> extends EventEmitter<
  CoreFeatures["events"] & TEvents
> {
  readonly state: CoreFeatures["state"];

  protected connectImpl: ConnectImpl = {
    noTls: Deno.connect,
    withTls: Deno.connectTls,
  };
  protected conn: Deno.Conn | null = null;
  protected hooks = new Hooks(this);

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

    // When `loadPlugins` is called, plugins can add their own error listeners.
    // In order to keep the default error throwing behavior (at least one error
    // listener is required to handle errors), `resetErrorThrowingBehavior`
    // should always be called after to ignore already added error listeners.
    loadPlugins(this, options, plugins);
    this.resetErrorThrowingBehavior();
  }

  /** Connects to a server using a hostname and an optional port.
   *
   * Default port to `6667`.
   * If `tls=true`, attempt to connect using a TLS connection.
   *
   * Resolves when connected. */
  async connect(
    hostname: string,
    port = PORT,
    tls = false,
  ): Promise<Deno.Conn | null> {
    this.state.remoteAddr = { hostname, port, tls };

    if (this.conn !== null) {
      this.close();
    }

    const { remoteAddr } = this.state;
    this.emit("connecting", remoteAddr);

    try {
      this.conn = await (tls
        ? this.connectImpl.withTls({ hostname, port })
        : this.connectImpl.noTls({ hostname, port }));
      this.emit("connected", remoteAddr);
    } catch (error) {
      this.emitError("connect", error);
      return null;
    }

    this.loop(this.conn);

    return this.conn;
  }

  protected async loop(conn: Deno.Conn): Promise<void> {
    for (;;) {
      const chunks = await this.read(conn);
      if (chunks === null) break;

      const messages = this.parser.parseMessages(chunks);

      for (const msg of messages) {
        this.emit("raw", msg);
      }
    }

    this.close();
  }

  protected async read(conn: Deno.Conn): Promise<string | null> {
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

  protected close(): void {
    if (this.conn === null) {
      return;
    }

    try {
      this.conn.close();
      this.emit("disconnected", this.state.remoteAddr);
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
    command: AnyCommand,
    ...params: (string | undefined)[]
  ): Promise<string | null> {
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

    // Prepares and encodes raw message.
    const raw = (command + " " + params.join(" ")).trimEnd() + "\r\n";
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

  /** Emits correctly an error. */
  emitError(...args: ErrorArgs): void {
    const [, error] = args;
    const isSilentError = (
      error instanceof Deno.errors.BadResource ||
      error instanceof Deno.errors.Interrupted
    );
    if (isSilentError) {
      return;
    }
    this.emit("error", toClientError(...args));
  }
}

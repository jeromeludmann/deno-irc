import { ClientError, ErrorArgs, toClientError } from "./errors.ts";
import { EventEmitter, EventEmitterOptions } from "./events.ts";
import { Hooks } from "./hooks.ts";
import { Parser, Raw } from "./parsers.ts";
import { AnyCommand } from "./protocol.ts";

export interface CoreParams {
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

export type PluginParams = {
  [K in "options" | "commands" | "events" | "state"]?: Record<string, unknown>;
};

export type ExtendedClient<T extends PluginParams> =
  & CoreClient<CoreParams["events"] & T["events"]>
  & { readonly hooks: Hooks<ExtendedClient<T> & { read: CoreClient["read"] }> }
  & { readonly state: T["state"] }
  & T["commands"];

export type ExtendedOptions<T extends PluginParams> =
  & CoreParams["options"]
  & T["options"];

export type Plugin<T extends PluginParams = Record<string, void>> = (
  client: ExtendedClient<T>,
  options: Readonly<ExtendedOptions<T>>,
) => void;

/** How to connect to a server */
interface ConnectImpl {
  noTls(opts: Deno.ConnectOptions): Promise<Deno.Conn>;
  withTls(opts: Deno.ConnectTlsOptions): Promise<Deno.Conn>;
}

export class CoreClient<
  TEvents extends CoreParams["events"] = CoreParams["events"],
> extends EventEmitter<
  CoreParams["events"] & TEvents
> {
  readonly state: CoreParams["state"];

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
    plugins: Plugin<any>[],
    options: Readonly<CoreParams["options"]>,
  ) {
    super(options);

    this.buffer = new Uint8Array(options.bufferSize ?? BUFFER_SIZE);
    this.state = { remoteAddr: { hostname: "", port: 0, tls: false } };

    new Set(plugins).forEach((plugin) => plugin(this, options));
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
      if (!(error instanceof Deno.errors.BadResource)) {
        this.emitError("read", error);
      }
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
  async send(command: AnyCommand, ...params: string[]): Promise<string | null> {
    if (this.conn === null) {
      this.emitError("write", "Unable to send message", this.send);
      return null;
    }

    const last = params.length - 1;
    if (
      params.length > 0 &&
      (params[last][0] === ":" || params[last].includes(" ", 1))
    ) {
      params[last] = ":" + params[last];
    }

    const raw = (command + " " + params.join(" ")).trimRight() + "\r\n";
    const bytes = this.encoder.encode(raw);

    try {
      await this.conn.write(bytes);
      return raw;
    } catch (error) {
      if (!(error instanceof Deno.errors.BadResource)) {
        this.emitError("write", error);
      }
      return null;
    }
  }

  /** Disconnects from the server. */
  disconnect(): void {
    this.close();
  }

  /** Emits correctly an error. */
  emitError(...args: ErrorArgs): void {
    this.emit("error", toClientError(...args));
  }
}

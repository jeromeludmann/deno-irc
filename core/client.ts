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
    "error": FatalError;
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
}

export class FatalError extends Error {
  constructor(
    public type: "connect" | "read" | "write" | "close",
    message: string,
  ) {
    super(`${type}: ${message}`);
    this.name = FatalError.name;
  }
}

export type PluginParams = {
  [K in "options" | "commands" | "events" | "state"]?: Record<string, any>;
};

export type ExtendedClient<T extends PluginParams = {}> =
  & CoreClient<CoreParams["events"] & T["events"]>
  & { readonly hooks: Hooks<ExtendedClient<T> & { read: CoreClient["read"] }> }
  & { readonly state: T["state"] }
  & T["commands"];

export type ExtendedOptions<T extends PluginParams = {}> = Readonly<
  & CoreParams["options"]
  & T["options"]
>;

export type Plugin<T extends PluginParams = {}> = (
  client: ExtendedClient<T>,
  options: ExtendedOptions<T>,
) => void;

export class CoreClient<
  TEvents extends CoreParams["events"] = CoreParams["events"],
> extends EventEmitter<
  CoreParams["events"] & TEvents
> {
  readonly state: CoreParams["state"];

  protected connectImpl = Deno.connect;
  protected conn: Deno.Conn | null = null;
  protected hooks = new Hooks(this);

  private decoder = new TextDecoder();
  private encoder = new TextEncoder();
  private parser = new Parser();
  private buffer: Uint8Array;

  constructor(
    plugins: Plugin<any>[],
    options: Readonly<CoreParams["options"]>,
  ) {
    super(options);

    this.buffer = new Uint8Array(options.bufferSize ?? BUFFER_SIZE);
    this.state = { remoteAddr: { hostname: "", port: 0 } };

    new Set(plugins).forEach((plugin) => plugin(this, options));
    this.resetErrorThrowingBehavior();
  }

  /** Connects to a server using a hostname and an optional port.
   *
   * Default port to `6667`.
   *
   * Resolves when connected. */
  async connect(hostname: string, port = PORT): Promise<Deno.Conn | null> {
    this.state.remoteAddr = { hostname, port };

    if (this.conn !== null) {
      this.close();
    }

    const { remoteAddr } = this.state;
    this.emit("connecting", remoteAddr);

    try {
      this.conn = await this.connectImpl({ hostname, port });
      this.emit("connected", remoteAddr);
    } catch (error) {
      this.emit("error", new FatalError("connect", error.message));
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
        this.emit("error", new FatalError("read", error.message));
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
      this.emit("error", new FatalError("close", error.message));
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
      this.emit("error", new FatalError("write", "Unable to send message"));
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
        this.emit("error", new FatalError("write", error.message));
      }
      return null;
    }
  }

  /** Disconnects from the server. */
  disconnect(): void {
    this.close();
  }
}

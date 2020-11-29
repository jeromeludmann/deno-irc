import { EventEmitter } from "./events.ts";
import { Parser, Raw } from "./parsers.ts";
import { AnyCommand } from "./protocol.ts";

export interface CoreParams {
  options: {
    /** Size of the buffer. Default to `4096` bytes. */
    bufferSize?: number;
  };

  events: {
    "connecting": RemoteAddr;
    "connected": RemoteAddr;
    "disconnected": RemoteAddr;
    "raw": Raw;
    "error": FatalError;
  };
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
  & { readonly state: T["state"] }
  & T["commands"];

export type ExtendedOptions<T extends PluginParams = {}> =
  & CoreParams["options"]
  & T["options"];

export type Plugin<T extends PluginParams = {}> = (
  client: ExtendedClient<T>,
  options: ExtendedOptions<T>,
) => void;

const BUFFER_SIZE = 4096;

const PORT = 6667;

export class CoreClient<
  TEvents extends CoreParams["events"] = CoreParams["events"],
> extends EventEmitter<
  CoreParams["events"] & TEvents
> {
  protected connectImpl = Deno.connect;
  protected conn: Deno.Conn | null = null;
  private bufferSize: number;
  private decoder = new TextDecoder();
  private encoder = new TextEncoder();
  private parser = new Parser();

  readonly state: Readonly<{}> = {};

  constructor(
    plugins: Plugin<any>[],
    options: Readonly<CoreParams["options"]>,
  ) {
    super();

    this.bufferSize = options.bufferSize ?? BUFFER_SIZE;
    new Set(plugins).forEach((plugin) => plugin(this, options));
    this.resetErrorThrowingBehavior();
  }

  /** Connects to a server using a hostname and an optional port.
   *
   * Resolves when connected. */
  async connect(hostname: string, port = PORT): Promise<Deno.Conn | null> {
    if (this.conn !== null) {
      this.close();
    }

    try {
      this.emit("connecting", { hostname, port });
      this.conn = await this.connectImpl({ hostname, port });
      this.emit("connected", getRemoteAddr(this.conn));
    } catch (error) {
      this.emit("error", new FatalError("connect", error.message));
      return null;
    }

    this.read(this.conn);
    return this.conn;
  }

  private async read(conn: Deno.Conn): Promise<void> {
    const buffer = new Uint8Array(this.bufferSize);
    let read: number | null;

    for (;;) {
      try {
        read = await conn.read(buffer);
        if (read === null) break;
      } catch (error) {
        if (!(error instanceof Deno.errors.BadResource)) {
          this.emit("error", new FatalError("read", error.message));
        }
        break;
      }

      const bytes = buffer.subarray(0, read);
      const raw = this.decoder.decode(bytes);
      const messages = this.parser.parseMessages(raw);

      for (const msg of messages) {
        this.emit("raw", msg);
      }
    }

    this.close();
  }

  private close() {
    if (this.conn === null) {
      return;
    }

    try {
      this.conn.close();
      this.emit("disconnected", getRemoteAddr(this.conn));
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

    const raw = `${command} ${params.join(" ")}`.trimRight();
    const bytes = this.encoder.encode(`${raw}\r\n`);

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

export interface RemoteAddr {
  hostname: string;
  port: number;
}

function getRemoteAddr(conn: Deno.Conn): RemoteAddr {
  const addr = conn.remoteAddr as Deno.NetAddr;
  const { hostname, port } = addr;
  return { hostname, port };
}

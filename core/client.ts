import * as Errors from "./errors.ts";
import { EventEmitter } from "./events.ts";
import type { Raw } from "./parsers.ts";
import { Parser } from "./parsers.ts";
import type { AnyCommand } from "./protocol.ts";

export interface Options {
  bufferSize?: number;
}

export interface Events {
  "connecting": RemoteAddr;
  "connected": RemoteAddr;
  "disconnected": RemoteAddr;
  "raw": Raw;
  "error": Errors.ModuleError;
}

type PluginParams = {
  [K in "options" | "commands" | "events" | "state"]?: Record<string, any>;
};

export type ExtendedClient<T extends PluginParams = {}> =
  & { options: T["options"] }
  & T["commands"]
  & Client<Events & T["events"]>
  & { state: T["state"] };

export type Plugin<T extends PluginParams = {}> = (
  client: ExtendedClient<T>,
) => void;

/** Composes a plugin from its functions. */
export function createPlugin<T extends PluginParams = {}>(
  ...fns: Plugin<T>[]
): Plugin<T> {
  return (client: ExtendedClient<T>) => fns.forEach((fn) => fn(client));
}

const BUFFER_SIZE = 4096;

const PORT = 6667;

/** Core features of the IRC client. */
export class Client<TEvents extends Events> extends EventEmitter<TEvents> {
  private conn: Deno.Conn | null = null;
  private decoder = new TextDecoder();
  private encoder = new TextEncoder();
  private parser = new Parser();
  state: Readonly<{}> = {};

  constructor(public options: Readonly<Options>, plugins: Plugin<any>[]) {
    super();

    this.on("error", (error) => {
      const caught = (
        this.listenerCount("error") > errorListenerCount ||
        error.cause instanceof Deno.errors.BadResource
      );

      if (!caught) {
        throw error;
      }
    });

    new Set(plugins).forEach((plugin) => plugin(this));
    const errorListenerCount = this.listenerCount("error");
  }

  /** Connects to a server using a hostname and an optional port. */
  async connect(hostname: string, port = PORT): Promise<void> {
    if (this.conn) {
      this.conn?.close();
      this.conn = null;
    }

    try {
      this.emit("connecting", { hostname, port });
      this.conn = await Deno.connect({ hostname, port });
      this.emit("connected", getRemoteAddr(this.conn));
    } catch (error) {
      this.emit("error", new Errors.ConnectError(error));
      return;
    }

    const buffer = new Uint8Array(this.options.bufferSize ?? BUFFER_SIZE);
    let read: number | null;

    for (;;) {
      try {
        read = await this.conn.read(buffer);
        if (read === null) break;
      } catch (error) {
        this.emit("error", new Errors.ReceiveError(error));
        break;
      }

      const bytes = buffer.subarray(0, read);
      const raw = this.decoder.decode(bytes);
      const messages = this.parser.parseMessages(raw);

      for (const msg of messages) {
        this.emit("raw", msg);
      }
    }

    try {
      this.conn.close();
    } catch (error) {
      this.emit("error", new Errors.DisconnectError(error));
    } finally {
      this.emit("disconnected", getRemoteAddr(this.conn));
      this.conn = null;
    }
  }

  /** Sends a raw message to the server. */
  async send(command: AnyCommand, ...params: string[]): Promise<void> {
    if (this.conn === null) {
      this.emit("error", new Errors.SendError("Not connected"));
      return;
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
    } catch (error) {
      this.emit("error", new Errors.SendError(error));
    }
  }

  /** Disconnects from the server. */
  async disconnect(): Promise<void> {
    if (this.conn === null) {
      return;
    }

    try {
      this.conn.close();
      await this.once("disconnected");
    } catch (error) {
      this.emit("error", new Errors.DisconnectError(error));
    }
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

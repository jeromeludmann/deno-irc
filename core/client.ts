import { EventEmitter } from "./events.ts";
import type { Raw } from "./parsers.ts";
import { Parser } from "./parsers.ts";
import type { AnyCommand } from "./protocol.ts";

export interface ClientParams {
  options: {
    bufferSize?: number;
  };
  events: {
    "connecting": RemoteAddr;
    "connected": RemoteAddr;
    "disconnected": RemoteAddr;
    "raw": Raw;
    "error:client": ClientError;
  };
}

type ClientOp = "connect" | "read" | "write" | "close" | "plugin";

export class ClientError extends Error {
  op: ClientOp;
  cause?: Error;

  constructor(op: ClientOp, cause: Error | string) {
    if (typeof cause === "string") {
      super(`${op}: ${cause}`);
    } else {
      super(`${op}: ${cause.message}`);
      this.cause = cause;
    }

    this.name = ClientError.name;
    this.op = op;
  }
}

type PluginParams = {
  [K in "options" | "commands" | "events" | "state"]?: Record<string, any>;
};

export type ExtendedClient<T extends PluginParams = {}> =
  & { options: T["options"] }
  & T["commands"]
  & Client<ClientParams["events"] & T["events"]>
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
export class Client<TEvents extends ClientParams["events"]>
  extends EventEmitter<TEvents> {
  private conn: Deno.Conn | null = null;
  private decoder = new TextDecoder();
  private encoder = new TextEncoder();
  private parser = new Parser();
  private listenerCounts: Record<keyof TEvents, number>;
  state: Readonly<{}> = {};

  constructor(
    public options: Readonly<ClientParams["options"]>,
    plugins: Plugin<any>[],
  ) {
    super();
    new Set(plugins).forEach((plugin) => plugin(this));
    this.listenerCounts = this.getAllListenersCounts();
  }

  /**
   * Connects to a server using a hostname and an optional port.
   *
   * Resolves only when connection has been closed.
   */
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
      this.emitError("error:client", new ClientError("connect", error));
      return;
    }

    const buffer = new Uint8Array(this.options.bufferSize ?? BUFFER_SIZE);
    let read: number | null;

    for (;;) {
      try {
        read = await this.conn.read(buffer);
        if (read === null) break;
      } catch (error) {
        this.emitError("error:client", new ClientError("read", error));
        break;
      }

      const bytes = buffer.subarray(0, read);
      const raw = this.decoder.decode(bytes);
      const messages = this.parser.parseMessages(raw);

      for (const msg of messages) {
        try {
          this.emit("raw", msg);
        } catch (error) {
          this.emitError("error:client", new ClientError("plugin", error));
        }
      }
    }

    try {
      this.conn.close();
    } catch (error) {
      this.emitError("error:client", new ClientError("close", error));
    } finally {
      this.emit("disconnected", getRemoteAddr(this.conn));
      this.conn = null;
    }
  }

  /** Sends a raw message to the server. */
  async send(command: AnyCommand, ...params: string[]): Promise<void> {
    if (this.conn === null) {
      this.emitError("error:client", new ClientError("write", "Not connected"));
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
      this.emitError("error:client", new ClientError("write", error));
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
      this.emitError("error:client", new ClientError("close", error));
    }
  }

  /** Emits an error and throw it if there are no related event listeners. */
  emitError(eventName: keyof TEvents, error: Error): void {
    const hasEventListener =
      this.getListenerCount(eventName) > (this.listenerCounts[eventName] ?? 0);

    const isBadResource = (
      error instanceof ClientError &&
      error.cause instanceof Deno.errors.BadResource
    );

    if (!hasEventListener && !isBadResource) {
      console.error(`
\x1b[31m
In order to prevent client from crashing, add an event listener to the event name "${eventName}":

    client.on("${eventName}", (error) => {
      // deal with error
    });
\x1b[39m`);
      throw error;
    }

    this.emit(eventName, error as unknown as TEvents[keyof TEvents]);
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

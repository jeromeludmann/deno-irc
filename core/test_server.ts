import { EventEmitter } from "../core/events.ts";
import type { AnyCommand } from "../core/protocol.ts";

interface ServerEvents extends Record<AnyCommand, string> {
  "client_accepted": null;
  "server_closed": null;
}

/** Test IRC server which allows to send arbitrary messages to clients. */
export class TestServer extends EventEmitter<ServerEvents> {
  port = generateRandomPort();
  host = "127.0.0.1";
  private decoder = new TextDecoder();
  private encoder = new TextEncoder();
  private listener?: Deno.Listener;
  private connections: Deno.Conn[] = [];

  /** Starts the test server. */
  listen() {
    for (;;) {
      try {
        this.listener = Deno.listen({
          hostname: this.host,
          port: this.port,
        });
        break;
      } catch (error) {
        if (error instanceof Deno.errors.AddrInUse) {
          this.port = generateRandomPort();
        } else {
          throw error;
        }
      }
    }

    this.loop(this.listener);
  }

  private async loop(listener: Deno.Listener) {
    for await (const conn of listener) {
      this.connections.push(conn);
      this.emit("client_accepted", null);

      try {
        for await (const bytes of Deno.iter(conn)) {
          const batch = this.decoder.decode(bytes).split("\r\n");
          batch.pop();

          for (const raw of batch) {
            const i = raw.indexOf(" ");
            const command = (i === -1 ? raw : raw.slice(0, i)) as AnyCommand;
            this.emit(command, raw);
          }
        }
      } catch (error) {
        switch (error.constructor) {
          case Deno.errors.BadResource:
          case Deno.errors.ConnectionReset:
            break;
          default:
            throw error;
        }
      }
    }

    this.emit("server_closed", null);
  }

  /** Sends messages to the client. */
  send(...messages: string[]) {
    if (this.connections.length === 0) {
      throw new Error("No connections");
    }

    for (const conn of this.connections) {
      for (const msg of messages) {
        conn.write(this.encoder.encode(`${msg}\r\n`));
      }
    }
  }

  /** Closes the connected client and stops the server. */
  close(): Promise<void> {
    return new Promise((resolve) => {
      this.connections.forEach((conn) => conn.close());
      this.connections = [];

      if (!this.listener) {
        resolve();
        return;
      }

      this.listener.close();
      this.listener = undefined;
      this.once("server_closed", () => resolve());
    });
  }

  /** Ensures that the client is correctly connected to the server. */
  async waitClient(): Promise<void> {
    await this.once("client_accepted");
  }
}

function generateRandomPort() {
  const from = 1025;
  const to = 65535;
  return Math.floor(Math.random() * (to - from) + from);
}

import { MockClient, MockCoreClient } from "./client.ts";
import { MockConn } from "./conn.ts";

export class MockServer {
  private client;

  constructor(client: MockCoreClient | MockClient) {
    this.client = client as unknown as { conn: MockConn | null };
  }

  private get conn() {
    if (this.client.conn === null) {
      throw new Error("Missing mock connection");
    }

    return this.client.conn;
  }

  /** Gets the received raw messages. */
  receive(): string[] {
    try {
      return this.conn.sent;
    } finally {
      this.conn.sent = [];
    }
  }

  /** Sends raw messages. */
  send(raw: string | string[]): void {
    if (!Array.isArray(raw)) {
      raw = [raw];
    }

    return this.conn.emit("read", raw);
  }

  close(): void {
    this.conn.emit("read", null);
  }
}

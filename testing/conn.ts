import { EventEmitter } from "../core/events.ts";
import type { Conn } from "../runtime/types.ts";

interface Events {
  "read": string[] | null;
}

export class MockConn extends EventEmitter<Events> implements Conn {
  private decoder = new TextDecoder();
  private encoder = new TextEncoder();

  raw: string[] = [];

  constructor(
    public readonly hostname: string,
    public readonly port: number,
  ) {
    super();
  }

  async read(buffer: Uint8Array): Promise<number | null> {
    const raw = await this.once("read");

    if (raw === null) {
      return null;
    }

    const str = raw.join("\r\n") + "\r\n";
    const bytes = this.encoder.encode(str);

    buffer.set(bytes);

    return bytes.length;
  }

  write(bytes: Uint8Array): Promise<number> {
    const str = this.decoder.decode(bytes);
    const raw = str.split("\r\n");
    raw.pop();

    this.raw.push(...raw);

    return Promise.resolve(bytes.length);
  }

  close(): void {
    this.emit("read", null);
  }
}

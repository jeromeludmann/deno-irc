import { EventEmitter } from "../core/events.ts";

interface Events {
  "read": string[] | null;
}

export class MockConn extends EventEmitter<Events> implements Deno.Conn {
  localAddr: Deno.NetAddr;
  remoteAddr: Deno.NetAddr;
  rid = -1;

  private decoder = new TextDecoder();
  private encoder = new TextEncoder();

  sent: string[] = [];

  constructor(hostname: string, port: number) {
    super();

    this.localAddr = {
      hostname: "local_host",
      port: 12345,
      transport: "tcp",
    };

    this.remoteAddr = {
      hostname,
      port,
      transport: "tcp",
    };
  }

  async read(buffer: Uint8Array): Promise<number | null> {
    const raw = await this.once("read");

    if (raw === null) {
      return null;
    }

    const bytes = this.encoder.encode(raw.join("\r\n") + "\r\n");
    this.decoder.decode(bytes);
    buffer.set(bytes);

    return bytes.length;
  }

  async write(bytes: Uint8Array): Promise<number> {
    const raw = this.decoder.decode(bytes);
    this.sent.push(...raw.split("\r\n").slice(0, -1));
    return bytes.length;
  }

  closeWrite(): void {}

  close(): void {
    this.emit("read", null);
  }
}

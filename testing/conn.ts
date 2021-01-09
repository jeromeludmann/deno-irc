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

  raw: string[] = [];

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

  closeWrite(): void {
    // Do nothing
  }

  close(): void {
    this.emit("read", null);
  }
}

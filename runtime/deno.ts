import type {
  Conn,
  ConnectOptions,
  ConnectTlsOptions,
  Runtime,
} from "./types.ts";

declare namespace Deno {
  interface Conn {
    read(b: Uint8Array): Promise<number | null>;
    write(b: Uint8Array): Promise<number>;
    close(): void;
  }
  function connect(opts: ConnectOptions): Promise<Conn>;
  function connectTls(opts: ConnectTlsOptions): Promise<Conn>;
  function readTextFileSync(path: string): string;
  namespace errors {
    class BadResource extends Error {}
    class Interrupted extends Error {}
  }
}

class DenoConn implements Conn {
  constructor(private inner: Deno.Conn) {}

  read(buffer: Uint8Array): Promise<number | null> {
    return this.inner.read(buffer);
  }

  write(bytes: Uint8Array): Promise<number> {
    return this.inner.write(bytes);
  }

  close(): void {
    this.inner.close();
  }
}

export const runtime: Runtime = {
  async connect(opts: ConnectOptions): Promise<Conn> {
    return new DenoConn(await Deno.connect(opts));
  },

  async connectTls(opts: ConnectTlsOptions): Promise<Conn> {
    return new DenoConn(await Deno.connectTls(opts));
  },

  readTextFileSync: Deno.readTextFileSync,

  isSilentError(error: unknown): boolean {
    return (
      error instanceof Deno.errors.BadResource ||
      error instanceof Deno.errors.Interrupted
    );
  },
};

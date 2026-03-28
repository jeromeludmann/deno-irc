// deno-lint-ignore-file

import { readFileSync } from "node:fs";
import type {
  Conn,
  ConnectOptions,
  ConnectTlsOptions,
  Runtime,
} from "./types.ts";

// Minimal Bun type declarations for cross-runtime type-checking (Deno).
// At runtime under Bun, the real globals are used.
declare global {
  // deno-lint-ignore no-var
  var Bun: {
    connect(opts: BunConnectOptions): Promise<BunSocket>;
  };
}

interface BunSocket {
  write(data: Uint8Array | string): number;
  end(): void;
  terminate(): void;
}

interface BunSocketHandler {
  open?(socket: BunSocket): void;
  data?(socket: BunSocket, data: Uint8Array): void;
  end?(socket: BunSocket): void;
  error?(socket: BunSocket, err: Error): void;
  close?(socket: BunSocket): void;
  connectError?(socket: BunSocket, err: Error): void;
  drain?(socket: BunSocket): void;
}

interface BunConnectOptions {
  hostname: string;
  port: number;
  socket: BunSocketHandler;
  tls?: {
    ca?: string;
    cert?: string;
    key?: string;
  };
}

class BunConn implements Conn {
  private chunks: Uint8Array[] = [];
  private pendingRead: {
    resolve: (n: number | null) => void;
    reject: (e: Error) => void;
    buffer: Uint8Array;
  } | null = null;
  private ended = false;
  private error: Error | null = null;

  readonly socket: BunSocket;

  constructor(
    socket: BunSocket,
    hooks: {
      onData: (cb: (data: Uint8Array) => void) => void;
      onEnd: (cb: () => void) => void;
      onError: (cb: (err: Error) => void) => void;
      onClose: (cb: () => void) => void;
    },
  ) {
    this.socket = socket;

    hooks.onData((chunk: Uint8Array) => {
      if (this.pendingRead) {
        const req = this.pendingRead;
        this.pendingRead = null;
        const len = Math.min(chunk.length, req.buffer.length);
        req.buffer.set(chunk.subarray(0, len));
        if (chunk.length > req.buffer.length) {
          this.chunks.push(chunk.subarray(req.buffer.length));
        }
        req.resolve(len);
      } else {
        this.chunks.push(new Uint8Array(chunk));
      }
    });

    hooks.onEnd(() => {
      this.ended = true;
      if (this.pendingRead) {
        const req = this.pendingRead;
        this.pendingRead = null;
        req.resolve(null);
      }
    });

    hooks.onError((err) => {
      this.error = err;
      if (this.pendingRead) {
        const req = this.pendingRead;
        this.pendingRead = null;
        req.reject(err);
      }
    });

    hooks.onClose(() => {
      this.ended = true;
      if (this.pendingRead) {
        const req = this.pendingRead;
        this.pendingRead = null;
        req.resolve(null);
      }
    });
  }

  read(buffer: Uint8Array): Promise<number | null> {
    if (this.chunks.length > 0) {
      const chunk = this.chunks.shift()!;
      const len = Math.min(chunk.length, buffer.length);
      buffer.set(chunk.subarray(0, len));
      if (chunk.length > buffer.length) {
        this.chunks.unshift(chunk.subarray(buffer.length));
      }
      return Promise.resolve(len);
    }
    if (this.ended) return Promise.resolve(null);
    if (this.error) return Promise.reject(this.error);

    return new Promise((resolve, reject) => {
      this.pendingRead = { resolve, reject, buffer };
    });
  }

  write(bytes: Uint8Array): Promise<number> {
    const written = this.socket.write(bytes);
    return Promise.resolve(written);
  }

  close(): void {
    this.socket.end();
  }
}

function connectSocket(opts: ConnectOptions): Promise<Conn> {
  return new Promise((resolve, reject) => {
    let onData: (data: Uint8Array) => void;
    let onEnd: () => void;
    let onError: (err: Error) => void;
    let onClose: () => void;

    const hooks = {
      onData: (cb: (data: Uint8Array) => void) => { onData = cb; },
      onEnd: (cb: () => void) => { onEnd = cb; },
      onError: (cb: (err: Error) => void) => { onError = cb; },
      onClose: (cb: () => void) => { onClose = cb; },
    };

    Bun.connect({
      hostname: opts.hostname,
      port: opts.port,
      socket: {
        open(socket) {
          resolve(new BunConn(socket, hooks));
        },
        data(_socket, data) {
          onData(new Uint8Array(data));
        },
        end(_socket) {
          onEnd();
        },
        error(_socket, err) {
          onError(err);
        },
        close(_socket) {
          onClose();
        },
        connectError(_socket, err) {
          reject(err);
        },
      },
    });
  });
}

function connectTlsSocket(opts: ConnectTlsOptions): Promise<Conn> {
  return new Promise((resolve, reject) => {
    let onData: (data: Uint8Array) => void;
    let onEnd: () => void;
    let onError: (err: Error) => void;
    let onClose: () => void;

    const hooks = {
      onData: (cb: (data: Uint8Array) => void) => { onData = cb; },
      onEnd: (cb: () => void) => { onEnd = cb; },
      onError: (cb: (err: Error) => void) => { onError = cb; },
      onClose: (cb: () => void) => { onClose = cb; },
    };

    Bun.connect({
      hostname: opts.hostname,
      port: opts.port,
      socket: {
        open(socket) {
          resolve(new BunConn(socket, hooks));
        },
        data(_socket, data) {
          onData(new Uint8Array(data));
        },
        end(_socket) {
          onEnd();
        },
        error(_socket, err) {
          onError(err);
        },
        close(_socket) {
          onClose();
        },
        connectError(_socket, err) {
          reject(err);
        },
      },
      tls: {
        ...(opts.caCerts && { ca: opts.caCerts.join("\n") }),
        ...(opts.cert && { cert: opts.cert }),
        ...(opts.key && { key: opts.key }),
      },
    });
  });
}

export const runtime: Runtime = {
  connect(opts: ConnectOptions): Promise<Conn> {
    return connectSocket(opts);
  },

  connectTls(opts: ConnectTlsOptions): Promise<Conn> {
    return connectTlsSocket(opts);
  },

  readTextFileSync(path: string): string {
    return readFileSync(path, "utf-8");
  },

  isSilentError(error: unknown): boolean {
    if (error instanceof Error) {
      const code = (error as { code?: string }).code;
      return code === "ECONNRESET" ||
        code === "ERR_STREAM_DESTROYED" ||
        error.message === "ConnectionClosed";
    }
    return false;
  },
};

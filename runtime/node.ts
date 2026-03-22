// deno-lint-ignore-file
// @ts-nocheck -- Node-only module, not type-checked under Deno

import { readFileSync } from "node:fs";
import { connect as netConnect, Socket } from "node:net";
import { connect as tlsConnect, type ConnectionOptions } from "node:tls";
import type {
  Conn,
  ConnectOptions,
  ConnectTlsOptions,
  Runtime,
} from "./types.ts";

class NodeConn implements Conn {
  private chunks: Uint8Array[] = [];
  private pendingRead: {
    resolve: (n: number | null) => void;
    reject: (e: Error) => void;
    buffer: Uint8Array;
  } | null = null;
  private ended = false;
  private error: Error | null = null;

  constructor(private socket: Socket) {
    socket.on("data", (chunk: Uint8Array) => {
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

    socket.on("end", () => {
      this.ended = true;

      if (this.pendingRead) {
        const req = this.pendingRead;
        this.pendingRead = null;
        req.resolve(null);
      }
    });

    socket.on("error", (err) => {
      this.error = err;

      if (this.pendingRead) {
        const req = this.pendingRead;
        this.pendingRead = null;
        req.reject(err);
      }
    });

    socket.on("close", () => {
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
    return new Promise((resolve, reject) => {
      this.socket.write(bytes, (err) => {
        if (err) reject(err);
        else resolve(bytes.length);
      });
    });
  }

  close(): void {
    this.socket.destroy();
  }
}

function connectSocket(port: number, hostname: string): Promise<Conn> {
  return new Promise((resolve, reject) => {
    const socket = netConnect(port, hostname, () => {
      socket.removeListener("error", reject);
      resolve(new NodeConn(socket));
    });
    socket.once("error", reject);
  });
}

function connectTlsSocket(opts: ConnectTlsOptions): Promise<Conn> {
  return new Promise((resolve, reject) => {
    const tlsOpts: ConnectionOptions = {
      host: opts.hostname,
      port: opts.port,
      ...(opts.caCerts && { ca: opts.caCerts.join("\n") }),
      ...(opts.cert && { cert: opts.cert }),
      ...(opts.key && { key: opts.key }),
    };

    const socket = tlsConnect(tlsOpts, () => {
      socket.removeListener("error", reject);
      resolve(new NodeConn(socket));
    });

    socket.once("error", reject);
  });
}

export const runtime: Runtime = {
  connect(opts: ConnectOptions): Promise<Conn> {
    return connectSocket(opts.port, opts.hostname);
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
      return code === "ERR_STREAM_DESTROYED" || code === "ECONNRESET";
    }
    return false;
  },
};

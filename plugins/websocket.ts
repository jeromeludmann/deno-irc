// WebSocket transport for IRC, per IRCv3 WebSocket draft.
//
// Based on the original work by @aronson and @xyzshantaram:
//   https://github.com/jeromeludmann/irc/issues/12
//   https://github.com/jeromeludmann/irc/pull/13

import { type RemoteAddr } from "../core/client.ts";
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import type { Conn } from "../runtime/types.ts";

export type WebSocketFeatures = Record<never, never>;

const SUBPROTOCOLS = ["binary.ircv3.net", "text.ircv3.net"];

function buildWebSocketUrl(
  hostname: string,
  port: number,
  tls: boolean,
  path?: string,
): string {
  const protocol = tls ? "wss" : "ws";
  const base = `${protocol}://${hostname}:${port}`;
  const url = new URL(path ?? "/", base);
  return url.href;
}

export class WebSocketConn implements Conn {
  private chunks: Uint8Array[] = [];
  private pendingRead: {
    resolve: (n: number | null) => void;
    reject: (e: Error) => void;
    buffer: Uint8Array;
  } | null = null;
  private ended = false;
  private error: Error | null = null;
  private encoder = new TextEncoder();

  constructor(private ws: WebSocket) {
    ws.onmessage = (event) => {
      let chunk: Uint8Array;

      if (event.data instanceof ArrayBuffer) {
        chunk = new Uint8Array(event.data);
      } else if (typeof event.data === "string") {
        chunk = this.encoder.encode(event.data);
      } else if (event.data instanceof Blob) {
        event.data.arrayBuffer().then((buf) => {
          this.push(new Uint8Array(buf));
        });
        return;
      } else {
        this.fail(new Error("Unexpected WebSocket message type"));
        return;
      }

      this.push(chunk);
    };

    ws.onclose = () => {
      this.ended = true;

      if (this.pendingRead) {
        const req = this.pendingRead;
        this.pendingRead = null;
        req.resolve(null);
      }
    };

    ws.onerror = () => {
      this.fail(new Error("WebSocket error"));
    };
  }

  private push(chunk: Uint8Array): void {
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
      this.chunks.push(chunk);
    }
  }

  private fail(error: Error): void {
    this.error = error;
    this.ended = true;

    if (this.pendingRead) {
      const req = this.pendingRead;
      this.pendingRead = null;
      req.reject(error);
    }
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
    if (this.error) return Promise.reject(this.error);
    if (this.ended) return Promise.resolve(null);

    return new Promise((resolve, reject) => {
      this.pendingRead = { resolve, reject, buffer };
    });
  }

  write(bytes: Uint8Array): Promise<number> {
    this.ws.send(bytes);
    return Promise.resolve(bytes.length);
  }

  close(): void {
    this.ws.close();
  }
}

function connectWebSocket(
  hostname: string,
  remoteAddr: RemoteAddr,
): Promise<Conn> {
  const url = buildWebSocketUrl(
    hostname,
    remoteAddr.port,
    !!remoteAddr.tls,
    remoteAddr.path,
  );
  const ws = new WebSocket(url, SUBPROTOCOLS);
  ws.binaryType = "arraybuffer";

  return new Promise<Conn>((resolve, reject) => {
    let settled = false;
    ws.onopen = () => {
      settled = true;
      resolve(new WebSocketConn(ws));
    };
    ws.onerror = () => {
      if (!settled) {
        settled = true;
        reject(new Error(`WebSocket connection to ${url} failed`));
      }
    };
    ws.onclose = () => {
      if (!settled) {
        settled = true;
        reject(new Error(`WebSocket connection to ${url} closed before open`));
      }
    };
  });
}

const plugin: Plugin<WebSocketFeatures, AnyPlugins> = createPlugin(
  "websocket",
  [],
)((client, _options) => {
  client.hooks.beforeCall("connect", (_hostname, options = {}) => {
    if (options.websocket && options.port === undefined) {
      throw new Error("WebSocket requires an explicit port");
    }
  });

  client.hooks.hookCall(
    "createConn",
    (originalCreateConn, hostname, remoteAddr) => {
      if (!remoteAddr.websocket) {
        return originalCreateConn(hostname, remoteAddr);
      }

      if (typeof globalThis.WebSocket === "undefined") {
        throw new Error(
          "WebSocket transport requires a runtime with WebSocket global " +
            "(Node 22+, Deno, Bun, or browser)",
        );
      }

      return connectWebSocket(hostname, remoteAddr);
    },
  );
});

export default plugin;

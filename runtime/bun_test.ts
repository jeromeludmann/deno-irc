// Bun-only test — run with: bun test runtime/bun_test.ts

import { expect, test } from "bun:test";
import { runtime } from "./bun.ts";

function listen(): Promise<
  { port: number; server: { stop(force?: boolean): void } }
> {
  return new Promise((resolve) => {
    const server = Bun.listen({
      hostname: "127.0.0.1",
      port: 0,
      socket: {
        data(socket, data) {
          socket.write(data);
        },
        open() {},
        close() {},
        error() {},
      },
    });
    resolve({ port: server.port, server });
  });
}

test("BunConn read/write round-trip", async () => {
  const { port, server } = await listen();

  const conn = await runtime.connect({ hostname: "127.0.0.1", port });

  const message = new TextEncoder().encode("hello IRC\r\n");
  const written = await conn.write(message);
  expect(written).toBe(message.length);

  const buffer = new Uint8Array(64);
  const read = await conn.read(buffer);
  expect(read).toBe(message.length);

  const received = new TextDecoder().decode(buffer.subarray(0, read!));
  expect(received).toBe("hello IRC\r\n");

  conn.close();
  server.stop(true);
});

test("BunConn buffers chunks arriving before read()", async () => {
  const server = Bun.listen({
    hostname: "127.0.0.1",
    port: 0,
    socket: {
      open(socket) {
        socket.write("chunk1\r\n");
        socket.write("chunk2\r\n");
      },
      data() {},
      close() {},
      error() {},
    },
  });

  const conn = await runtime.connect({
    hostname: "127.0.0.1",
    port: server.port,
  });

  // Small delay to let both chunks arrive and buffer
  await new Promise((r) => setTimeout(r, 50));

  const buf = new Uint8Array(64);
  const n = await conn.read(buf);
  if (n === null) throw new TypeError("Unexpected EOF");
  const text = new TextDecoder().decode(buf.subarray(0, n));

  // May arrive as one merged chunk or two separate — both are valid
  expect(text.includes("chunk1")).toBe(true);

  conn.close();
  server.stop(true);
});

test("BunConn read() returns null on end", async () => {
  const server = Bun.listen({
    hostname: "127.0.0.1",
    port: 0,
    socket: {
      open(socket) {
        socket.end();
      },
      data() {},
      close() {},
      error() {},
    },
  });

  const conn = await runtime.connect({
    hostname: "127.0.0.1",
    port: server.port,
  });

  const buffer = new Uint8Array(64);
  const read = await conn.read(buffer);
  expect(read).toBeNull();

  conn.close();
  server.stop(true);
});

test("BunConn splits chunk larger than buffer", async () => {
  const server = Bun.listen({
    hostname: "127.0.0.1",
    port: 0,
    socket: {
      open(socket) {
        socket.write("abcdefghij"); // 10 bytes
      },
      data() {},
      close() {},
      error() {},
    },
  });

  const conn = await runtime.connect({
    hostname: "127.0.0.1",
    port: server.port,
  });

  // Small delay to let the chunk arrive
  await new Promise((r) => setTimeout(r, 50));

  // Read with a small buffer (4 bytes)
  const small = new Uint8Array(4);
  const n1 = await conn.read(small);
  expect(n1).toBe(4);
  expect(new TextDecoder().decode(small)).toBe("abcd");

  // Remaining bytes should be available
  const rest = new Uint8Array(10);
  const n2 = await conn.read(rest);
  expect(n2).toBe(6);
  expect(new TextDecoder().decode(rest.subarray(0, n2!))).toBe("efghij");

  conn.close();
  server.stop(true);
});

test("BunConn read() resolves null on close (disconnect)", async () => {
  const server = Bun.listen({
    hostname: "127.0.0.1",
    port: 0,
    socket: {
      data() {},
      open() {},
      close() {},
      error() {},
    },
  });

  const conn = await runtime.connect({
    hostname: "127.0.0.1",
    port: server.port,
  });

  // Start a read that will be pending
  const buffer = new Uint8Array(64);
  const readPromise = conn.read(buffer);

  // Close the socket (simulates disconnect)
  conn.close();

  // The pending read must resolve null, not hang forever
  const result = await readPromise;
  expect(result).toBeNull();

  server.stop(true);
});

test("isSilentError recognizes ECONNRESET", () => {
  const err = new Error("connection reset");
  (err as NodeJS.ErrnoException).code = "ECONNRESET";
  expect(runtime.isSilentError(err)).toBe(true);
});

test("isSilentError recognizes ERR_STREAM_DESTROYED", () => {
  const err = new Error("stream destroyed");
  (err as NodeJS.ErrnoException).code = "ERR_STREAM_DESTROYED";
  expect(runtime.isSilentError(err)).toBe(true);
});

test("isSilentError recognizes ConnectionClosed", () => {
  const err = new Error("ConnectionClosed");
  expect(runtime.isSilentError(err)).toBe(true);
});

test("isSilentError rejects normal errors", () => {
  expect(runtime.isSilentError(new Error("boom"))).toBe(false);
});

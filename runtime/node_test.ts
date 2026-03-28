// Node-only test — run with: npx tsx --test runtime/node_test.ts

import { strictEqual } from "node:assert";
import { createServer } from "node:net";
import { test } from "node:test";
import { runtime } from "./node.ts";

function listen(
  server: ReturnType<typeof createServer>,
): Promise<{ port: number }> {
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        throw new TypeError("Expected server.address() to return a NetAddress");
      }
      resolve({ port: addr.port });
    })
  );
}

test("NodeConn read/write round-trip", async () => {
  const server = createServer((socket) => {
    socket.on("data", (data) => {
      // Echo back
      socket.write(data);
    });
  });
  const { port } = await listen(server);

  const conn = await runtime.connect({ hostname: "127.0.0.1", port });

  const message = new TextEncoder().encode("hello IRC\r\n");
  const written = await conn.write(message);
  strictEqual(written, message.length);

  const buffer = new Uint8Array(64);
  const read = await conn.read(buffer);
  strictEqual(read, message.length);

  const received = new TextDecoder().decode(buffer.subarray(0, read));
  strictEqual(received, "hello IRC\r\n");

  conn.close();
  server.close();
});

test("NodeConn buffers chunks arriving before read()", async () => {
  const server = createServer((socket) => {
    // Send two chunks immediately
    socket.write("chunk1\r\n");
    socket.write("chunk2\r\n");
  });
  const { port } = await listen(server);

  const conn = await runtime.connect({ hostname: "127.0.0.1", port });

  // Small delay to let both chunks arrive and buffer
  await new Promise((r) => setTimeout(r, 50));

  const buf1 = new Uint8Array(64);
  const n1 = await conn.read(buf1);
  if (n1 === null) throw new TypeError("Unexpected EOF");
  const text = new TextDecoder().decode(buf1.subarray(0, n1));

  // May arrive as one merged chunk or two separate — both are valid
  strictEqual(text.includes("chunk1"), true);

  conn.close();
  server.close();
});

test("NodeConn read() returns null on end", async () => {
  const server = createServer((socket) => {
    socket.end();
  });
  const { port } = await listen(server);

  const conn = await runtime.connect({ hostname: "127.0.0.1", port });

  const buffer = new Uint8Array(64);
  const read = await conn.read(buffer);
  strictEqual(read, null);

  conn.close();
  server.close();
});

test("NodeConn splits chunk larger than buffer", async () => {
  const server = createServer((socket) => {
    socket.write("abcdefghij"); // 10 bytes
  });
  const { port } = await listen(server);

  const conn = await runtime.connect({ hostname: "127.0.0.1", port });

  // Read with a small buffer (4 bytes)
  const small = new Uint8Array(4);
  const n1 = await conn.read(small);
  strictEqual(n1, 4);
  strictEqual(new TextDecoder().decode(small), "abcd");

  // Remaining bytes should be available
  const rest = new Uint8Array(10);
  const n2 = await conn.read(rest);
  strictEqual(n2, 6);
  strictEqual(new TextDecoder().decode(rest.subarray(0, n2)), "efghij");

  conn.close();
  server.close();
});

test("NodeConn read() resolves null on destroy (disconnect)", async () => {
  const server = createServer();
  const { port } = await listen(server);

  const conn = await runtime.connect({ hostname: "127.0.0.1", port });

  // Start a read that will be pending
  const buffer = new Uint8Array(64);
  const readPromise = conn.read(buffer);

  // Destroy the socket (simulates disconnect)
  conn.close();

  // The pending read must resolve null, not hang forever
  const result = await readPromise;
  strictEqual(result, null);

  server.close();
});

test("isSilentError recognizes ECONNRESET", () => {
  const err = new Error("connection reset");
  (err as NodeJS.ErrnoException).code = "ECONNRESET";
  strictEqual(runtime.isSilentError(err), true);
});

test("isSilentError recognizes ERR_STREAM_DESTROYED", () => {
  const err = new Error("stream destroyed");
  (err as NodeJS.ErrnoException).code = "ERR_STREAM_DESTROYED";
  strictEqual(runtime.isSilentError(err), true);
});

test("isSilentError rejects normal errors", () => {
  strictEqual(runtime.isSilentError(new Error("boom")), false);
});

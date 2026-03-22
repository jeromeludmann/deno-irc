import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { runtime } from "./deno.ts";

describe("runtime/deno", (test) => {
  test("read/write round-trip", async () => {
    const listener = Deno.listen({ hostname: "127.0.0.1", port: 0 });
    const { port } = listener.addr as Deno.NetAddr;

    const accept = (async () => {
      const server = await listener.accept();
      const buf = new Uint8Array(64);
      const n = await server.read(buf);
      await server.write(buf.subarray(0, n!));
      server.close();
    })();

    const conn = await runtime.connect({ hostname: "127.0.0.1", port });

    const message = new TextEncoder().encode("hello IRC\r\n");
    const written = await conn.write(message);
    assertEquals(written, message.length);

    const buffer = new Uint8Array(64);
    const read = await conn.read(buffer);
    assertEquals(read, message.length);

    const received = new TextDecoder().decode(buffer.subarray(0, read!));
    assertEquals(received, "hello IRC\r\n");

    conn.close();
    await accept;
    listener.close();
  });

  test("read() returns null on end", async () => {
    const listener = Deno.listen({ hostname: "127.0.0.1", port: 0 });
    const { port } = listener.addr as Deno.NetAddr;

    const accept = (async () => {
      const server = await listener.accept();
      server.close();
    })();

    const conn = await runtime.connect({ hostname: "127.0.0.1", port });

    const buffer = new Uint8Array(64);
    const read = await conn.read(buffer);
    assertEquals(read, null);

    conn.close();
    await accept;
    listener.close();
  });

  test("isSilentError recognizes Deno errors", () => {
    assertEquals(runtime.isSilentError(new Deno.errors.BadResource()), true);
    assertEquals(runtime.isSilentError(new Deno.errors.Interrupted()), true);
  });

  test("isSilentError rejects normal errors", () => {
    assertEquals(runtime.isSilentError(new Error("boom")), false);
  });
});

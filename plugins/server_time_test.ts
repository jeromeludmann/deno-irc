import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/server_time", (test) => {
  test("push 'server-time' capability", async () => {
    const { client } = await mock();

    assertEquals(
      client.state.caps.requested.includes("server-time"),
      true,
    );
  });

  test("parse server time from message tags", async () => {
    const { client, server } = await mock();

    server.send(
      "@time=2026-03-22T10:30:00.000Z :nick!user@host PRIVMSG #chan :hello",
    );
    const msg = await client.once("raw:privmsg");
    const time = client.utils.getServerTime(msg);

    assertEquals(time instanceof Date, true);
    assertEquals(time!.toISOString(), "2026-03-22T10:30:00.000Z");
  });

  test("return null when no time tag", async () => {
    const { client, server } = await mock();

    server.send(":nick!user@host PRIVMSG #chan :hello");
    const msg = await client.once("raw:privmsg");
    const time = client.utils.getServerTime(msg);

    assertEquals(time, null);
  });

  test("return null for invalid time tag", async () => {
    const { client, server } = await mock();

    server.send("@time=not-a-date :nick!user@host PRIVMSG #chan :hello");
    const msg = await client.once("raw:privmsg");
    const time = client.utils.getServerTime(msg);

    assertEquals(time, null);
  });
});

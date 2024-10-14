// deno-lint-ignore-file no-control-regex
import { assertEquals, assertMatch } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/ping", (test) => {
  Date.now = () => 1646397815196;

  test("send PING", async () => {
    const { client, server } = await mock();

    client.ping();
    client.ping("#channel");
    const raw = server.receive();

    assertMatch(raw[0], /^PING .+$/);
    assertMatch(raw[1], /^PRIVMSG #channel :\x01PING .+\x01$/);
  });

  test("emit 'ping' on PING", async () => {
    const { client, server } = await mock();

    server.send("PING :key");
    const msg = await client.once("ping");

    assertEquals(msg, {
      source: undefined,
      params: { keys: ["key"] },
    });
  });

  test("emit 'pong' on PONG", async () => {
    const { client, server } = await mock();

    server.send("PONG daemon :1646397814696");
    const msg = await client.once("pong");

    assertEquals(msg, {
      source: undefined,
      params: { daemon: "daemon", key: "1646397814696", latency: 500 },
    });
  });

  test("emit 'ctcp_ping' on CTCP PING query", async () => {
    const { client, server } = await mock();

    server.send(":someone!user@host PRIVMSG #channel :\x01PING key\x01");
    const msg = await client.once("ctcp_ping");

    assertEquals(msg, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "#channel", key: "key" },
    });
  });

  test("emit 'ctcp_ping_reply' on CTCP PING reply", async () => {
    const { client, server } = await mock();

    server.send(":someone!user@host NOTICE me :\x01PING 1646397814696\x01");
    const msg = await client.once("ctcp_ping_reply");

    assertEquals(msg, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { key: "1646397814696", latency: 500 },
    });
  });

  test("reply to PING", async () => {
    const { client, server } = await mock();

    server.send("PING :key");
    await client.once("ping");
    const raw = server.receive();

    assertEquals(raw, ["PONG key"]);
  });

  test("reply to CTCP PING query", async () => {
    const { client, server } = await mock();

    server.send(":someone!user@host PRIVMSG me :\x01PING key\x01");
    await client.once("ctcp_ping");
    const raw = server.receive();

    assertEquals(raw, ["NOTICE someone :\x01PING key\x01"]);
  });
});

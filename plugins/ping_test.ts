// deno-lint-ignore-file no-control-regex
import { assertEquals, assertMatch } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { ctcpPlugin } from "./ctcp.ts";
import { pingPlugin } from "./ping.ts";

describe("plugins/ping", (test) => {
  const plugins = [ctcpPlugin, pingPlugin];

  test("send PING", async () => {
    const { client, server } = await mock(plugins, {});

    client.ping();
    client.ping("#channel");
    const raw = server.receive();

    assertMatch(raw[0], /^PING .+$/);
    assertMatch(raw[1], /^PRIVMSG #channel :\x01PING .+\x01$/);
  });

  test("emit 'ping' on PING", async () => {
    const { client, server } = await mock(plugins, {});

    server.send("PING :key");
    const msg = await client.once("ping");

    assertEquals(msg, { keys: ["key"] });
  });

  test("emit 'pong' on PONG", async () => {
    const { client, server } = await mock(plugins, {});

    server.send("PONG daemon :key");
    const msg = await client.once("pong");

    assertEquals(msg, {
      origin: "",
      daemon: "daemon",
      key: "key",
    });
  });

  test("emit 'ctcp_ping' on CTCP PING query", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host PRIVMSG #channel :\x01PING key\x01");
    const msg = await client.once("ctcp_ping");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      target: "#channel",
      key: "key",
    });
  });

  test("emit 'ctcp_ping_reply' on CTCP PING reply", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host NOTICE me :\x01PING key\x01");
    const msg = await client.once("ctcp_ping_reply");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      target: "me",
      key: "key",
    });
  });

  test("reply to PING", async () => {
    const { client, server } = await mock(plugins, {});

    server.send("PING :key");
    await client.once("ping");
    const raw = server.receive();

    assertEquals(raw, ["PONG key"]);
  });

  test("reply to CTCP PING query", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host PRIVMSG me :\x01PING key\x01");
    await client.once("ctcp_ping");
    const raw = server.receive();

    assertEquals(raw, ["NOTICE someone :\x01PING key\x01"]);
  });
});

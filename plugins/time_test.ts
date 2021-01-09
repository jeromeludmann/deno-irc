// deno-lint-ignore-file no-control-regex
import { assertEquals, assertMatch } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { ctcp } from "./ctcp.ts";
import { time } from "./time.ts";

describe("plugins/time", (test) => {
  const plugins = [ctcp, time];

  test("send TIME", async () => {
    const { client, server } = await mock(plugins, {});

    client.time();
    client.time("#channel");
    const raw = server.receive();

    assertEquals(raw, [
      "TIME",
      "PRIVMSG #channel \x01TIME\x01",
    ]);
  });

  test("emit 'ctcp_time' on CTCP TIME query", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host PRIVMSG #channel :\x01TIME\x01");
    const msg = await client.once("ctcp_time");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      target: "#channel",
    });
  });

  test("emit 'ctcp_time_reply' on CTCP TIME reply", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(
      ":someone!user@host NOTICE me :\x01TIME Tue Sep 01 2020 20:17:48 GMT+0200 (CEST)\x01",
    );
    const msg = await client.once("ctcp_time_reply");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      target: "me",
      time: "Tue Sep 01 2020 20:17:48 GMT+0200 (CEST)",
    });
  });

  test("reply to CTCP TIME query", async () => {
    const { client, server } = await mock(
      plugins,
      { ctcpReplies: { time: true } },
    );

    server.send(":someone!user@host PRIVMSG me :\x01TIME\x01");
    await client.once("ctcp_time");
    const raw = server.receive();

    assertMatch(raw[0], /^NOTICE someone :\x01TIME .+\x01$/);
  });

  test("not reply to CTCP TIME query if disabled", async () => {
    const { client, server } = await mock(
      plugins,
      { ctcpReplies: { time: false } },
    );

    server.send(":someone!user@host PRIVMSG me :\x01TIME\x01");
    await client.once("ctcp_time");
    const raw = server.receive();

    assertEquals(raw, []);
  });
});

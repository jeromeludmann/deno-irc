import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { clientinfo } from "./clientinfo.ts";
import { ctcp } from "./ctcp.ts";

describe("plugins/clientinfo", (test) => {
  const plugins = [ctcp, clientinfo];

  test("send CTCP CLIENTINFO", async () => {
    const { client, server } = await mock(plugins, {});

    client.clientinfo("#channel");
    const raw = server.receive();

    assertEquals(raw, ["PRIVMSG #channel \x01CLIENTINFO\x01"]);
  });

  test("emit 'ctcp_clientinfo' on CTCP CLIENTINFO query", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host PRIVMSG #channel :\x01CLIENTINFO\x01");
    const msg = await client.once("ctcp_clientinfo");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      target: "#channel",
    });
  });

  test("emit 'ctcp_clientinfo_reply' on CTCP CLIENTINFO reply", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(
      ":someone!user@host NOTICE me :\x01CLIENTINFO PING TIME VERSION\x01",
    );
    const msg = await client.once("ctcp_clientinfo_reply");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      target: "me",
      supported: ["PING", "TIME", "VERSION"],
    });
  });

  test("reply to CTCP CLIENTINFO query", async () => {
    const { client, server } = await mock(
      plugins,
      { ctcpReplies: { clientinfo: true } },
    );

    server.send(":someone!user@host PRIVMSG me :\x01CLIENTINFO\x01");
    await client.once("ctcp_clientinfo");
    const raw = server.receive();

    assertEquals(
      raw,
      ["NOTICE someone :\x01CLIENTINFO PING TIME VERSION\x01"],
    );
  });

  test("not reply to CTCP CLIENTINFO query if disabled", async () => {
    const { client, server } = await mock(
      plugins,
      { ctcpReplies: { clientinfo: false } },
    );

    server.send(":someone!user@host PRIVMSG me :\x01CLIENTINFO\x01");
    await client.once("ctcp_clientinfo");
    const raw = server.receive();

    assertEquals(raw, []);
  });
});

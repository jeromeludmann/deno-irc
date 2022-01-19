import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/clientinfo", (test) => {
  test("send CTCP CLIENTINFO", async () => {
    const { client, server } = await mock();

    client.clientinfo("#channel");
    const raw = server.receive();

    assertEquals(raw, ["PRIVMSG #channel \x01CLIENTINFO\x01"]);
  });

  test("emit 'ctcp_clientinfo' on CTCP CLIENTINFO query", async () => {
    const { client, server } = await mock();

    server.send(":someone!user@host PRIVMSG #channel :\x01CLIENTINFO\x01");
    const msg = await client.once("ctcp_clientinfo");

    assertEquals(msg, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "#channel" },
    });
  });

  test("emit 'ctcp_clientinfo_reply' on CTCP CLIENTINFO reply", async () => {
    const { client, server } = await mock();

    server.send(
      ":someone!user@host NOTICE me :\x01CLIENTINFO PING TIME VERSION\x01",
    );
    const msg = await client.once("ctcp_clientinfo_reply");

    assertEquals(msg, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { supported: ["PING", "TIME", "VERSION"] },
    });
  });

  test("reply to CTCP CLIENTINFO query", async () => {
    const { client, server } = await mock({
      ctcpReplies: { clientinfo: true },
    });

    server.send(":someone!user@host PRIVMSG me :\x01CLIENTINFO\x01");
    await client.once("ctcp_clientinfo");
    const raw = server.receive();

    assertEquals(
      raw,
      ["NOTICE someone :\x01CLIENTINFO PING TIME VERSION\x01"],
    );
  });

  test("not reply to CTCP CLIENTINFO query if disabled", async () => {
    const { client, server } = await mock({
      ctcpReplies: { clientinfo: false },
    });

    server.send(":someone!user@host PRIVMSG me :\x01CLIENTINFO\x01");
    await client.once("ctcp_clientinfo");
    const raw = server.receive();

    assertEquals(raw, []);
  });
});

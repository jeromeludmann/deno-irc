import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/ctcp", (test) => {
  test("send CTCP", async () => {
    const { client, server } = await mock();

    client.ctcp("#channel", "TIME");
    client.ctcp("#channel", "ACTION", "param");
    const raw = server.receive();

    assertEquals(
      raw,
      [
        "PRIVMSG #channel \x01TIME\x01",
        "PRIVMSG #channel :\x01ACTION param\x01",
      ],
    );
  });

  test("emit 'ctcp' on CTCP", async () => {
    const { client, server } = await mock();
    const messages = [];

    server.send(
      ":someone!user@host PRIVMSG #channel :\x01CTCP_COMMAND\x01",
    );
    messages.push(await client.once("ctcp"));

    server.send(
      ":someone!user@host NOTICE #channel :\x01CTCP_COMMAND param\x01",
    );
    messages.push(await client.once("ctcp"));

    assertEquals(messages, [
      {
        source: {
          name: "someone",
          mask: { user: "user", host: "host" },
        },
        command: "CTCP_COMMAND",
        params: {
          target: "#channel",
          type: "query",
        },
      },
      {
        source: {
          name: "someone",
          mask: { user: "user", host: "host" },
        },
        command: "CTCP_COMMAND",
        params: {
          target: "#channel",
          type: "reply",
          param: "param",
        },
      },
    ]);
  });

  test("check CTCP message", async () => {
    const { client } = await mock();

    assertEquals(
      client.utils.isCtcp(
        { command: "privmsg", params: ["nick", "Hello world"] },
      ),
      false,
    );

    assertEquals(
      client.utils.isCtcp({
        command: "notice",
        params: ["nick", "Hello world"],
      }),
      false,
    );

    assertEquals(
      client.utils.isCtcp({
        command: "privmsg",
        params: ["nick", "\x01Hello world\x01"],
      }),
      true,
    );

    assertEquals(
      client.utils.isCtcp({
        command: "notice",
        params: ["nick", "\x01Hello world\x01"],
      }),
      true,
    );

    assertEquals(
      client.utils.isCtcp({
        command: "join",
        params: ["nick", "\x01Hello world\x01"],
      }),
      false,
    );

    assertEquals(
      client.utils.isCtcp({
        command: "join",
        params: ["nick"],
      }),
      false,
    );

    assertEquals(
      client.utils.isCtcp({
        command: "join",
        params: [],
      }),
      false,
    );
  });
});

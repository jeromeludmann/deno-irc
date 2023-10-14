import { assertEquals } from "../deps.ts";
import { delay, describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/ctcp", (test) => {
  test("send CTCP", async () => {
    const { client, server } = await mock();

    client.ctcp("#channel", "TIME");
    client.ctcp("#channel", "ACTION", "param");
    // Allow queue to dispatch messages
    await delay();
    const raw = server.receive();

    assertEquals(
      raw,
      [
        "PRIVMSG #channel \x01TIME\x01",
        "PRIVMSG #channel :\x01ACTION param\x01",
      ],
    );
  });

  test("emit 'ctcp:*' on CTCP", async () => {
    const { client, server } = await mock();
    const messages = [];

    server.send(
      ":someone!user@host PRIVMSG me :\x01PING key\x01",
    );
    messages.push(await client.once("raw_ctcp:ping"));

    server.send(
      ":someone!user@host NOTICE me :\x01PING key\x01",
    );
    messages.push(await client.once("raw_ctcp:ping_reply"));

    assertEquals(messages, [
      {
        source: { name: "someone", mask: { user: "user", host: "host" } },
        command: "ping",
        params: { target: "me", arg: "key" },
      },
      {
        source: { name: "someone", mask: { user: "user", host: "host" } },
        command: "ping",
        params: { target: "me", arg: "key" },
      },
    ]);
  });

  test("check CTCP message", async () => {
    const { client } = await mock();

    assertEquals(
      client.utils.isCtcp({
        command: "privmsg",
        params: ["nick", "Hello world"],
      }),
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
        params: ["nick"],
      }),
      false,
    );

    assertEquals(
      client.utils.isCtcp({
        command: "privmsg",
        params: ["nick", "\x01COMMAND\x01"],
      }),
      true,
    );

    assertEquals(
      client.utils.isCtcp({
        command: "privmsg",
        params: ["nick", "\x01COMMAND argument\x01"],
      }),
      true,
    );

    assertEquals(
      client.utils.isCtcp({
        command: "notice",
        params: ["nick"],
      }),
      false,
    );

    assertEquals(
      client.utils.isCtcp({
        command: "notice",
        params: ["nick", "\x01COMMAND\x01"],
      }),
      true,
    );

    assertEquals(
      client.utils.isCtcp({
        command: "notice",
        params: ["nick", "\x01COMMAND argument\x01"],
      }),
      true,
    );
  });
});

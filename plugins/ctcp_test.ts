import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/ctcp", (test) => {
  test("send CTCP", async () => {
    const { client, server } = await mock();

    client.ctcp("#channel", "TIME");
    client.ctcp("#channel", "ACTION", "param");
    client.ctcp("user", "DCC", "SEND file.bin 203.0.113.10 6000 12345");

    const raw = server.receive();

    assertEquals(
      raw,
      [
        "PRIVMSG #channel \x01TIME\x01",
        "PRIVMSG #channel :\x01ACTION param\x01",
        "PRIVMSG user :\x01DCC SEND file.bin 203.0.113.10 6000 12345\x01",
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

    server.send(
      ":someone!user@host PRIVMSG me :\x01DCC SEND f 203.0.113.10 6000 123\x01",
    );
    messages.push(await client.once("raw_ctcp:dcc"));

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
      {
        source: { name: "someone", mask: { user: "user", host: "host" } },
        command: "dcc",
        params: { target: "me", arg: "SEND f 203.0.113.10 6000 123" },
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

    assertEquals(
      client.utils.isCtcp({
        command: "privmsg",
        params: ["nick", "\x01DCC SEND file.txt 203.0.113.10 6000 1234\x01"],
      }),
      true,
    );

    assertEquals(
      client.utils.isCtcp({
        command: "privmsg",
        params: ["nick", "\x01DCC\x01"], // bare DCC, no arg
      }),
      true,
    );

    assertEquals(
      client.utils.isCtcp({
        command: "notice",
        params: ["nick", "\x01DCC CHAT 203.0.113.10 6001\x01"],
      }),
      true,
    );
  });
});

import { assertEquals, assertThrows } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { Parser, parseUserMask } from "./parsers.ts";

describe("core/parsers", (test) => {
  test("parse chunks of raw messages", () => {
    const parser = new Parser();
    const messages = [];
    const raw = [
      ":serverhost NOTICE Auth :*** Looking up",
      " your hostname...\r\n:serverhost 001 nick :Wel",
      "come to the server\r\n:nick!user@host JOIN #channel\r\n",
      "PING serverhost\r\n:nick!user@host PRIVMSG #channel ::!@ ;\r\n",
    ];

    for (const msg of parser.parseMessages(raw[0])) {
      messages.push(msg);
    }

    assertEquals(messages.length, 0);

    for (const msg of parser.parseMessages(raw[1])) {
      messages.push(msg);
    }

    assertEquals(messages.length, 1);

    for (const msg of parser.parseMessages(raw[2])) {
      messages.push(msg);
    }

    assertEquals(messages.length, 3);

    for (const msg of parser.parseMessages(raw[3])) {
      messages.push(msg);
    }

    assertEquals(messages.length, 5);

    assertEquals(messages, [
      {
        prefix: "serverhost",
        command: "NOTICE",
        params: ["Auth", "*** Looking up your hostname..."],
        raw: ":serverhost NOTICE Auth :*** Looking up your hostname...",
      },
      {
        prefix: "serverhost",
        command: "RPL_WELCOME",
        params: ["nick", "Welcome to the server"],
        raw: ":serverhost 001 nick :Welcome to the server",
      },
      {
        prefix: "nick!user@host",
        command: "JOIN",
        params: ["#channel"],
        raw: ":nick!user@host JOIN #channel",
      },
      {
        prefix: "",
        command: "PING",
        params: ["serverhost"],
        raw: "PING serverhost",
      },
      {
        prefix: "nick!user@host",
        command: "PRIVMSG",
        params: ["#channel", ":!@ ;"],
        raw: ":nick!user@host PRIVMSG #channel ::!@ ;",
      },
    ]);
  });

  test("parse user mask", () => {
    assertEquals(
      parseUserMask("nick!user@host"),
      {
        nick: "nick",
        username: "user",
        userhost: "host",
      },
    );

    assertThrows(
      () => parseUserMask("serverhost"),
      Error,
      "Not a user mask: serverhost",
    );
  });
});

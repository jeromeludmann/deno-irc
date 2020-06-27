import { Parser, parseUserMask } from "./parsers.ts";
import { assertEquals, AssertionError } from "./test_deps.ts";

Deno.test("parseMessages", () => {
  const parser = new Parser();
  const raw1 = ":serverhost NOTICE Auth :*** Looking up";
  const raw2 = " your hostname...\r\n:serverhost 001 nick :Wel";
  const raw3 = "come to the server\r\n:nick!user@host JOIN #channel\r\n";
  const raw4 = "PING serverhost\r\n:nick!user@host PRIVMSG #channel ::!@ ;\r\n";

  const messages1 = [];
  for (const msg of parser.parseMessages(raw1)) {
    messages1.push(msg);
  }
  assertEquals(messages1.length, 0);

  const messages2 = [];
  for (const msg of parser.parseMessages(raw2)) {
    messages2.push(msg);
  }
  assertEquals(
    messages2,
    [{
      prefix: "serverhost",
      command: "NOTICE",
      params: ["Auth", "*** Looking up your hostname..."],
      raw: ":serverhost NOTICE Auth :*** Looking up your hostname...",
    }],
  );

  const messages3 = [];
  for (const msg of parser.parseMessages(raw3)) {
    messages3.push(msg);
  }
  assertEquals(
    messages3,
    [{
      prefix: "serverhost",
      command: "RPL_WELCOME",
      params: ["nick", "Welcome to the server"],
      raw: ":serverhost 001 nick :Welcome to the server",
    }, {
      prefix: "nick!user@host",
      command: "JOIN",
      params: ["#channel"],
      raw: ":nick!user@host JOIN #channel",
    }],
  );

  const messages4 = [];
  for (const msg of parser.parseMessages(raw4)) {
    messages4.push(msg);
  }
  assertEquals(
    messages4,
    [{
      prefix: "",
      command: "PING",
      params: ["serverhost"],
      raw: "PING serverhost",
    }, {
      prefix: "nick!user@host",
      command: "PRIVMSG",
      params: ["#channel", ":!@ ;"],
      raw: ":nick!user@host PRIVMSG #channel ::!@ ;",
    }],
  );
});

Deno.test("parseUserMask", async () => {
  assertEquals(
    parseUserMask("nick!user@host"),
    {
      nick: "nick",
      username: "user",
      userhost: "host",
    },
  );

  try {
    parseUserMask("serverhost");
    throw new AssertionError("should throw");
  } catch (error) {
    assertEquals(error.name, "Error");
    assertEquals(error.message, "Not a user mask: serverhost");
  }
});

import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { Parser } from "./parsers.ts";

describe("core/parsers", (test) => {
  test("parse message without prefix", () => {
    const parser = new Parser();

    const msg = Array.from(parser.parseMessages("PING :QimVSbibZg\r\n"));

    assertEquals(msg, [{
      command: "ping",
      params: ["QimVSbibZg"],
    }]);
  });

  test("parse message with server prefix", () => {
    const parser = new Parser();

    const msg = Array.from(
      parser.parseMessages(
        ":serverhost NOTICE * :*** Looking up your hostname...\r\n",
      ),
    );

    assertEquals(msg, [{
      command: "notice",
      params: ["*", "*** Looking up your hostname..."],
      source: { name: "serverhost" },
    }]);
  });

  test("parse message with user prefix", () => {
    const parser = new Parser();

    const msg = Array.from(
      parser.parseMessages(":someone!user@host JOIN #channel\r\n"),
    );

    assertEquals(msg, [{
      command: "join",
      params: ["#channel"],
      source: { mask: { host: "host", user: "user" }, name: "someone" },
    }]);
  });

  test("parse message with tags", () => {
    const parser = new Parser();

    const msg = Array.from(
      parser.parseMessages(
        "@aaa=bbb;ccc;example.com/ddd=eee :someone!user@host JOIN #channel\r\n",
      ),
    );

    assertEquals(msg, [{
      command: "join",
      params: ["#channel"],
      source: { mask: { host: "host", user: "user" }, name: "someone" },
      tags: { "aaa": "bbb", "ccc": undefined, "example.com/ddd": "eee" },
    }]);
  });

  test("parse chunks of raw messages", () => {
    const parser = new Parser();

    const raw1 = Array.from(
      parser.parseMessages(":serverhost NOTICE Auth :*** Looking up"),
    );
    assertEquals(raw1, []);

    const raw2 = Array.from(parser.parseMessages(
      " your hostname...\r\n:serverhost 001 nick :Wel",
    ));
    assertEquals(raw2, [
      {
        source: { name: "serverhost" },
        command: "notice",
        params: ["Auth", "*** Looking up your hostname..."],
      },
    ]);

    const raw3 = Array.from(parser.parseMessages(
      "come to the server\r\n:nick!user@host JOIN #channel\r\n",
    ));
    assertEquals(raw3, [
      {
        source: { name: "serverhost" },
        command: "rpl_welcome",
        params: ["nick", "Welcome to the server"],
      },
      {
        source: { name: "nick", mask: { user: "user", host: "host" } },
        command: "join",
        params: ["#channel"],
      },
    ]);

    const raw4 = Array.from(parser.parseMessages(
      "PING serverhost\r\n:nick!user@host PRIVMSG #channel ::!@ ;\r\n",
    ));
    assertEquals(raw4, [
      {
        command: "ping",
        params: ["serverhost"],
      },
      {
        source: { name: "nick", mask: { user: "user", host: "host" } },
        command: "privmsg",
        params: ["#channel", ":!@ ;"],
      },
    ]);
  });
});

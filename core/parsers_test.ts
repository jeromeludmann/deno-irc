import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { escapeTagValue, Parser, unescapeTagValue } from "./parsers.ts";

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

  test("parse message with tags but no source", () => {
    const parser = new Parser();

    const msg = Array.from(
      parser.parseMessages("@time=2026-03-24T12:00:00Z PING :server\r\n"),
    );

    assertEquals(msg, [{
      command: "ping",
      params: ["server"],
      tags: { "time": "2026-03-24T12:00:00Z" },
    }]);
  });

  test("parse message with empty tag value", () => {
    const parser = new Parser();

    const msg = Array.from(
      parser.parseMessages("@key= :nick!u@h PRIVMSG #chan :text\r\n"),
    );

    assertEquals(msg[0].tags, { "key": "" });
  });

  test("parse message with multiple escaped tags", () => {
    const parser = new Parser();

    const msg = Array.from(
      parser.parseMessages(
        "@a=1\\s2;b=x\\:y;c :nick!u@h PRIVMSG #chan :text\r\n",
      ),
    );

    assertEquals(msg[0].tags, { "a": "1 2", "b": "x;y", "c": undefined });
  });

  test("parse tags split across chunks", () => {
    const parser = new Parser();

    const raw1 = Array.from(
      parser.parseMessages("@time=2026-03-24T12:00:00Z :nick!u@h PRI"),
    );
    assertEquals(raw1, []);

    const raw2 = Array.from(
      parser.parseMessages("VMSG #chan :hello\r\n"),
    );
    assertEquals(raw2.length, 1);
    assertEquals(raw2[0].tags, { "time": "2026-03-24T12:00:00Z" });
    assertEquals(raw2[0].params, ["#chan", "hello"]);
  });

  test("parse message with escaped tag values", () => {
    const parser = new Parser();

    const msg = Array.from(
      parser.parseMessages(
        "@msg=hello\\sworld\\:test\\\\end :nick!u@h PRIVMSG #chan :text\r\n",
      ),
    );

    assertEquals(msg[0].tags, { "msg": "hello world;test\\end" });
  });

  test("unescape tag values", () => {
    assertEquals(unescapeTagValue("hello\\sworld"), "hello world");
    assertEquals(unescapeTagValue("a\\:b"), "a;b");
    assertEquals(unescapeTagValue("a\\\\b"), "a\\b");
    assertEquals(unescapeTagValue("a\\rb"), "a\rb");
    assertEquals(unescapeTagValue("a\\nb"), "a\nb");
    assertEquals(unescapeTagValue("no\\escape"), "noescape");
    assertEquals(unescapeTagValue("plain"), "plain");
  });

  test("escape tag values", () => {
    assertEquals(escapeTagValue("hello world"), "hello\\sworld");
    assertEquals(escapeTagValue("a;b"), "a\\:b");
    assertEquals(escapeTagValue("a\\b"), "a\\\\b");
    assertEquals(escapeTagValue("a\rb"), "a\\rb");
    assertEquals(escapeTagValue("a\nb"), "a\\nb");
    assertEquals(escapeTagValue("plain"), "plain");
  });

  test("roundtrip tag escape/unescape", () => {
    const original = "hello world;semi\\backslash\r\n";
    assertEquals(unescapeTagValue(escapeTagValue(original)), original);
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

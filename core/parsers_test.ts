import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { escapeTagValue, parseChunk, unescapeTagValue } from "./parsers.ts";

describe("core/parsers", (test) => {
  test("parse message without prefix", () => {
    const [msgs] = parseChunk("PING :QimVSbibZg\r\n");

    assertEquals(msgs, [{
      command: "ping",
      params: ["QimVSbibZg"],
    }]);
  });

  test("parse message with server prefix", () => {
    const [msgs] = parseChunk(
      ":serverhost NOTICE * :*** Looking up your hostname...\r\n",
    );

    assertEquals(msgs, [{
      command: "notice",
      params: ["*", "*** Looking up your hostname..."],
      source: { name: "serverhost" },
    }]);
  });

  test("parse message with user prefix", () => {
    const [msgs] = parseChunk(
      ":someone!user@host JOIN #channel\r\n",
    );

    assertEquals(msgs, [{
      command: "join",
      params: ["#channel"],
      source: { mask: { host: "host", user: "user" }, name: "someone" },
    }]);
  });

  test("parse message with tags", () => {
    const [msgs] = parseChunk(
      "@aaa=bbb;ccc;example.com/ddd=eee :someone!user@host JOIN #channel\r\n",
    );

    assertEquals(msgs, [{
      command: "join",
      params: ["#channel"],
      source: { mask: { host: "host", user: "user" }, name: "someone" },
      tags: { "aaa": "bbb", "ccc": undefined, "example.com/ddd": "eee" },
    }]);
  });

  test("parse message with tags but no source", () => {
    const [msgs] = parseChunk(
      "@time=2026-03-24T12:00:00Z PING :server\r\n",
    );

    assertEquals(msgs, [{
      command: "ping",
      params: ["server"],
      tags: { "time": "2026-03-24T12:00:00Z" },
    }]);
  });

  test("parse message with empty tag value", () => {
    const [msgs] = parseChunk(
      "@key= :nick!u@h PRIVMSG #chan :text\r\n",
    );

    assertEquals(msgs[0].tags, { "key": "" });
  });

  test("parse message with multiple escaped tags", () => {
    const [msgs] = parseChunk(
      "@a=1\\s2;b=x\\:y;c :nick!u@h PRIVMSG #chan :text\r\n",
    );

    assertEquals(msgs[0].tags, { "a": "1 2", "b": "x;y", "c": undefined });
  });

  test("parse tags split across chunks", () => {
    const [msgs1, chunk] = parseChunk(
      "@time=2026-03-24T12:00:00Z :nick!u@h PRI",
    );
    assertEquals(msgs1, []);

    const [msgs2] = parseChunk(chunk + "VMSG #chan :hello\r\n");
    assertEquals(msgs2.length, 1);
    assertEquals(msgs2[0].tags, { "time": "2026-03-24T12:00:00Z" });
    assertEquals(msgs2[0].params, ["#chan", "hello"]);
  });

  test("parse message with escaped tag values", () => {
    const [msgs] = parseChunk(
      "@msg=hello\\sworld\\:test\\\\end :nick!u@h PRIVMSG #chan :text\r\n",
    );

    assertEquals(msgs[0].tags, { "msg": "hello world;test\\end" });
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
    const [raw1, chunk1] = parseChunk(
      ":serverhost NOTICE Auth :*** Looking up",
    );
    assertEquals(raw1, []);

    const [raw2, chunk2] = parseChunk(
      chunk1 + " your hostname...\r\n:serverhost 001 nick :Wel",
    );
    assertEquals(raw2, [
      {
        source: { name: "serverhost" },
        command: "notice",
        params: ["Auth", "*** Looking up your hostname..."],
      },
    ]);

    const [raw3, chunk3] = parseChunk(
      chunk2 + "come to the server\r\n:nick!user@host JOIN #channel\r\n",
    );
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
    assertEquals(chunk3, "");

    const [raw4] = parseChunk(
      "PING serverhost\r\n:nick!user@host PRIVMSG #channel ::!@ ;\r\n",
    );
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

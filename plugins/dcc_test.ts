import { assert, assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/dcc", (test) => {
  // utils: nextToken
  test("utils: nextToken parses tokens and offsets", async () => {
    const { client } = await mock();
    const { utils: { dcc: { nextToken: nt } } } = client;

    // Unquoted tokens + offsets
    assertEquals(nt("foo bar baz", 0), { tok: "foo", next: 4 });
    assertEquals(nt("foo bar baz", 4), { tok: "bar", next: 8 });
    assertEquals(nt("foo bar baz", 8), { tok: "baz", next: 11 });

    // Leading spaces and single token
    assertEquals(nt("   token   rest", 0), { tok: "token", next: 9 });
    assertEquals(nt("alone", 0), { tok: "alone", next: 5 });

    // Quoted with spaces
    assertEquals(nt(`"my file.bin" 203.0.113.10 6000 123`, 0), {
      tok: "my file.bin",
      next: 14,
    });

    // Escaped quotes
    assertEquals(nt(`"with \\\"quote\\\".txt" 203.0.113.10`, 0), {
      tok: `with "quote".txt`,
      next: 21,
    });

    // Escaped backslashes
    assertEquals(nt(`"C:\\\\path\\\\file.bin" 1.2.3.4`, 0), {
      tok: `C:\\path\\file.bin`,
      next: 21,
    });

    // Bracketed IPv6
    assertEquals(nt(`[2001:db8::1] 6000 123`, 0), {
      tok: `[2001:db8::1]`,
      next: 14,
    });

    // Unterminated quote -> remainder
    assertEquals(nt(`"unterminated`, 0), { tok: "unterminated", next: 13 });

    // Sequence with internal offsets and extra spaces
    const s = `SEND   "my file.txt"   203.0.113.10  6000   123`;
    let i = "SEND".length + 1;
    const t1 = nt(s, i);
    const t2 = nt(s, t1.next);
    const t3 = nt(s, t2.next);
    const t4 = nt(s, t3.next);
    const t5 = nt(s, t4.next);
    assertEquals([t1.tok, t2.tok, t3.tok, t4.tok, t5.tok], [
      "my file.txt",
      "203.0.113.10",
      "6000",
      "123",
      "",
    ]);
  });

  // utils: parseHost
  test("utils: parseHost normalizes IPv4, IPv6, and hostnames", async () => {
    const { client } = await mock();
    const { utils: { dcc: { parseHost } } } = client;

    // Decimal IPv4 bounds
    assertEquals(parseHost("4294967295"), {
      type: "ipv4",
      value: "255.255.255.255",
    });
    assertEquals(parseHost("4294967296"), undefined);

    // Dotted IPv4
    assertEquals(parseHost("203.0.113.10"), {
      type: "ipv4",
      value: "203.0.113.10",
    });
    assertEquals(parseHost("08.01.001.1"), undefined);
    assertEquals(parseHost("256.0.0.1"), undefined);

    // IPv6 (brackets/scope lowercased)
    assertEquals(parseHost("[FE80::1%eth0]"), {
      type: "ipv6",
      value: "fe80::1",
    });
    assertEquals(parseHost("2001:DB8::1"), {
      type: "ipv6",
      value: "2001:db8::1",
    });
    assertEquals(parseHost("[fe80]"), { type: "ipv6", value: "fe80" });
    assertEquals(parseHost("::"), { type: "ipv6", value: "::" });
    assertEquals(parseHost("[::]"), { type: "ipv6", value: "::" });

    // Hostname normalize
    assertEquals(parseHost("Example.COM."), {
      type: "hostname",
      value: "example.com",
    });

    // Single-label rejected
    assertEquals(parseHost("localhost"), undefined);

    // Trimming and empty
    assertEquals(parseHost("   203.0.113.10   "), {
      type: "ipv4",
      value: "203.0.113.10",
    });
    assertEquals(parseHost(""), undefined);
    assertEquals(parseHost("   "), undefined);
  });

  // utils: isPassivePlaceholder
  test("utils: isPassivePlaceholder detects 0.0.0.0 and ::", async () => {
    const { client } = await mock();
    const { utils: { dcc: { isPassivePlaceholder } } } = client;

    assertEquals(isPassivePlaceholder("0"), true);
    assertEquals(isPassivePlaceholder("0.0.0.0"), true);
    assertEquals(isPassivePlaceholder("::"), true);
    assertEquals(isPassivePlaceholder("203.0.113.10"), false);
  });

  // utils: parsePort
  test("utils: parsePort validates active and passive", async () => {
    const { client } = await mock();
    const { utils: { dcc: { parsePort } } } = client;

    // Active: 1..65535
    assertEquals(parsePort("1", false), 1);
    assertEquals(parsePort("65535", false), 65535);
    assertEquals(parsePort("0", false), undefined);
    assertEquals(parsePort("65536", false), undefined);
    assertEquals(parsePort("abc", false), undefined);
    assertEquals(parsePort("", false), undefined);

    // Passive: any uint -> 0
    assertEquals(parsePort("0", true), 0);
    assertEquals(parsePort("1", true), 0);
    assertEquals(parsePort("65535", true), 0);
    assertEquals(parsePort("65536", true), 0);
    assertEquals(parsePort("abc", true), undefined);
    assertEquals(parsePort("", true), undefined);
  });

  // utils: parseUint
  test("utils: parseUint supports max and safe bounds", async () => {
    const { client } = await mock();
    const { utils: { dcc: { parseUint } } } = client;

    // No max
    assertEquals(parseUint("0"), 0);
    assertEquals(parseUint("1"), 1);
    assertEquals(parseUint("00042"), 42);
    assertEquals(
      parseUint(String(Number.MAX_SAFE_INTEGER)),
      Number.MAX_SAFE_INTEGER,
    );
    assertEquals(parseUint(String(Number.MAX_SAFE_INTEGER + 1)), undefined);
    assertEquals(parseUint(""), undefined);
    assertEquals(parseUint("abc"), undefined);
    assertEquals(parseUint("-1"), undefined);

    // With max
    const MAX32 = 0xFFFF_FFFF;
    assertEquals(parseUint("4294967295", MAX32), 4294967295);
    assertEquals(parseUint("4294967296", MAX32), undefined);
    assertEquals(parseUint("65535", 65535), 65535);
    assertEquals(parseUint("65536", 65535), undefined);

    // Sanity
    assertEquals(parseUint("abc", MAX32), undefined);
    assertEquals(
      parseUint(String(Number.MAX_SAFE_INTEGER + 1), MAX32),
      undefined,
    );
  });

  // parser: ignores bare and unknown verbs
  test("parser: ignores bare DCC and unknown verbs", async () => {
    const { client } = await mock();
    const { utils: { dcc: { createDcc } } } = client;

    const bare = createDcc({
      source: { name: "nick", mask: { user: "u", host: "h" } },
      command: "dcc",
      params: { target: "me", arg: "DCC" },
    });
    assertEquals(bare, undefined);

    const unknown = createDcc({
      source: { name: "nick", mask: { user: "u", host: "h" } },
      command: "dcc",
      params: { target: "me", arg: "FOOBAR 1 2 3" },
    });
    assertEquals(unknown, undefined);
  });

  // parser: prototype pollution does not match verbs
  test("parser: proto-polluted verb falls through", async () => {
    const { client } = await mock();
    const { utils: { dcc: { createDcc } } } = client;

    try {
      // Make "weird" in DCC_SCHEMA true via prototype, not own prop.
      (Object.prototype as any).weird = 1;

      const ev = createDcc({
        source: { name: "n", mask: { user: "u", host: "h" } },
        command: "dcc",
        params: { target: "me", arg: "WEIRD arg1 arg2" }, // lowercased -> "weird"
      });

      // Branches for send/chat/schat/resume/accept will not match -> falls through.
      assertEquals(ev, undefined);
    } finally {
      delete (Object.prototype as any).weird;
    }
  });

  // parser: SEND (table-driven)
  test("parser: SEND covers IPv4/IPv6/FQDN/passive/token/size bounds", async () => {
    const { client } = await mock();
    const { utils: { dcc: { createDcc } } } = client;

    const cases = [
      {
        arg: 'SEND "f.bin" 203.0.113.10 6000 123',
        exp: {
          action: "send",
          filename: "f.bin",
          ip: { type: "ipv4", value: "203.0.113.10" },
          port: 6000,
          passive: false,
          size: 123,
          token: undefined,
          text: 'SEND "f.bin" 203.0.113.10 6000 123',
        },
      },
      {
        arg: 'SEND "f.bin" 0.0.0.0 1234 123 77',
        exp: {
          action: "send",
          filename: "f.bin",
          ip: { type: "ipv4", value: "0.0.0.0" },
          port: 0,
          passive: true,
          size: 123,
          token: 77,
          text: 'SEND "f.bin" 0.0.0.0 1234 123 77',
        },
      },
      {
        arg: 'send "f.bin" 203.0.113.10 0 123 99', // case-insensitive verb
        exp: {
          action: "send",
          filename: "f.bin",
          ip: { type: "ipv4", value: "203.0.113.10" },
          port: 0,
          passive: true,
          size: 123,
          token: 99,
          text: 'send "f.bin" 203.0.113.10 0 123 99',
        },
      },
      {
        arg: 'SEND "f.bin" 0 6000 123 9', // decimal IPv4 zero -> passive
        exp: {
          action: "send",
          filename: "f.bin",
          ip: { type: "ipv4", value: "0.0.0.0" },
          port: 0,
          passive: true,
          size: 123,
          token: 9,
          text: 'SEND "f.bin" 0 6000 123 9',
        },
      },
      {
        arg: 'SEND "f.bin" 4294967295 6000 1', // decimal IPv4 upper bound
        exp: {
          action: "send",
          filename: "f.bin",
          ip: { type: "ipv4", value: "255.255.255.255" },
          port: 6000,
          passive: false,
          size: 1,
          token: undefined,
          text: 'SEND "f.bin" 4294967295 6000 1',
        },
      },
      {
        arg: 'SEND "with \\"quote\\".txt" 203.0.113.10 6000 1',
        exp: {
          action: "send",
          filename: 'with "quote".txt',
          ip: { type: "ipv4", value: "203.0.113.10" },
          port: 6000,
          passive: false,
          size: 1,
          token: undefined,
          text: 'SEND "with \\"quote\\".txt" 203.0.113.10 6000 1',
        },
      },
      {
        arg: 'SEND "f.bin" Example.COM. 6000 1', // FQDN trailing dot
        exp: {
          action: "send",
          filename: "f.bin",
          ip: { type: "hostname", value: "example.com" },
          port: 6000,
          passive: false,
          size: 1,
          token: undefined,
          text: 'SEND "f.bin" Example.COM. 6000 1',
        },
      },
      {
        arg: 'SEND "f.bin" [fe80::1%eth0] 6000 1',
        exp: {
          action: "send",
          filename: "f.bin",
          ip: { type: "ipv6", value: "fe80::1" },
          port: 6000,
          passive: false,
          size: 1,
          token: undefined,
          text: 'SEND "f.bin" [fe80::1%eth0] 6000 1',
        },
      },
      {
        arg: 'SEND "f.bin" 203.0.113.10 6000 0', // size=0
        exp: {
          action: "send",
          filename: "f.bin",
          ip: { type: "ipv4", value: "203.0.113.10" },
          port: 6000,
          passive: false,
          size: 0,
          token: undefined,
          text: 'SEND "f.bin" 203.0.113.10 6000 0',
        },
      },
      {
        arg: `SEND "f.bin" 203.0.113.10 6000 ${
          String(
            Number.MAX_SAFE_INTEGER,
          )
        }`, // size max safe
        exp: {
          action: "send",
          filename: "f.bin",
          ip: { type: "ipv4", value: "203.0.113.10" },
          port: 6000,
          passive: false,
          size: Number.MAX_SAFE_INTEGER,
          token: undefined,
          text: `SEND "f.bin" 203.0.113.10 6000 ${
            String(
              Number.MAX_SAFE_INTEGER,
            )
          }`,
        },
      },
    ] as const;

    for (const c of cases) {
      const ev = createDcc({
        source: { name: "n", mask: { user: "u", host: "h" } },
        command: "dcc",
        params: { target: "me", arg: c.arg },
      })!;
      assertEquals(ev, c.exp);
    }

    const invalid = [
      'SEND "f.bin" bad 6000 10', // bad host
      'SEND "f.bin" 01.2.3.4 6000 10', // leading zeros
      'SEND "f.bin" 203.0.113.10 70000 10', // port high
      'SEND "f.bin" :: 0 10 notanum', // bad token (passive)
      'SEND "f.bin" :: 0 123', // passive without token
      'SEND "f.bin" 203.0.113.10 6000', // missing size
      `SEND "f.bin" 203.0.113.10 6000 ${Number.MAX_SAFE_INTEGER + 1}`, // size overflow
    ];
    for (const arg of invalid) {
      const r = createDcc({
        source: { name: "n", mask: { user: "u", host: "h" } },
        command: "dcc",
        params: { target: "me", arg },
      });
      assertEquals(r, undefined);
    }
  });

  // parser: CHAT and SCHAT (table-driven)
  test("parser: CHAT and SCHAT cover subtype, passive, and tls", async () => {
    const { client } = await mock();
    const { utils: { dcc: { createDcc } } } = client;

    const cases = [
      {
        arg: "CHAT [2001:DB8::1] 6000",
        exp: {
          action: "chat",
          ip: { type: "ipv6", value: "2001:db8::1" },
          port: 6000,
          passive: false,
          token: undefined,
          text: "CHAT [2001:DB8::1] 6000",
          tls: false,
        },
      },
      {
        arg: "CHAT :: 6000 42", // passive placeholder
        exp: {
          action: "chat",
          ip: { type: "ipv6", value: "::" },
          port: 0,
          passive: true,
          token: 42,
          text: "CHAT :: 6000 42",
          tls: false,
        },
      },
      {
        arg: "CHAT 0 6000 7", // decimal 0 placeholder
        exp: {
          action: "chat",
          ip: { type: "ipv4", value: "0.0.0.0" },
          port: 0,
          passive: true,
          token: 7,
          text: "CHAT 0 6000 7",
          tls: false,
        },
      },
      {
        arg: "CHAT chat 203.0.113.10 6000", // optional subtype
        exp: {
          action: "chat",
          ip: { type: "ipv4", value: "203.0.113.10" },
          port: 6000,
          passive: false,
          token: undefined,
          text: "CHAT chat 203.0.113.10 6000",
          tls: false,
        },
      },
      {
        arg: "CHAT Example.COM 6000",
        exp: {
          action: "chat",
          ip: { type: "hostname", value: "example.com" },
          port: 6000,
          passive: false,
          token: undefined,
          text: "CHAT Example.COM 6000",
          tls: false,
        },
      },
      {
        arg: "SCHAT 2001:DB8::1 6000",
        exp: {
          action: "chat",
          ip: { type: "ipv6", value: "2001:db8::1" },
          port: 6000,
          passive: false,
          token: undefined,
          text: "SCHAT 2001:DB8::1 6000",
          tls: true,
        },
      },
      {
        arg: "SCHAT :: 6000 42",
        exp: {
          action: "chat",
          ip: { type: "ipv6", value: "::" },
          port: 0,
          passive: true,
          token: 42,
          text: "SCHAT :: 6000 42",
          tls: true,
        },
      },
    ] as const;

    for (const c of cases) {
      const ev = createDcc({
        source: { name: "n", mask: { user: "u", host: "h" } },
        command: "dcc",
        params: { target: "me", arg: c.arg },
      })!;
      assertEquals(ev, c.exp);
    }

    const invalid = [
      "CHAT 203.0.113.10", // missing port
      "SCHAT :: 6000", // passive without token
      "SCHAT -bad_host 6000", // bad hostname
      "SCHAT 256.300.1.1 6000", // bad IPv4
      "SCHAT 203.0.113.10 99999", // bad port
      "SCHAT 6000", // missing IP
    ];
    for (const arg of invalid) {
      const r = createDcc({
        source: { name: "n", mask: { user: "u", host: "h" } },
        command: "dcc",
        params: { target: "me", arg },
      });
      assertEquals(r, undefined);
    }
  });

  // parser: SCHAT differs from CHAT only by tls flag
  test("parser: SCHAT differs from CHAT only by tls flag", async () => {
    const { client } = await mock();
    const { utils: { dcc: { createDcc } } } = client;

    const chat = createDcc({
      source: { name: "n", mask: { user: "u", host: "h" } },
      command: "dcc",
      params: { target: "me", arg: "CHAT 203.0.113.10 6000 5" },
    })!;
    const schat = createDcc({
      source: { name: "n", mask: { user: "u", host: "h" } },
      command: "dcc",
      params: { target: "me", arg: "SCHAT 203.0.113.10 6000 5" },
    })!;

    assert(chat.action === "chat");
    assert(schat.action === "chat");

    const strip = (o: any) => {
      const { text, tls, ...rest } = o;
      return rest;
    };
    assertEquals(strip(chat), strip(schat));
    assertEquals(chat.tls, false);
    assertEquals(schat.tls, true);
  });

  // parser: RESUME and ACCEPT
  test("parser: RESUME and ACCEPT handle passive and position", async () => {
    const { client } = await mock();
    const { utils: { dcc: { createDcc } } } = client;

    const cases = [
      {
        arg: 'RESUME "f.bin" 6000 1024',
        exp: {
          action: "resume",
          filename: "f.bin",
          port: 6000,
          position: 1024,
          passive: false,
          token: undefined,
          text: 'RESUME "f.bin" 6000 1024',
        },
      },
      {
        arg: 'ACCEPT "f.bin" 0 1024 99',
        exp: {
          action: "accept",
          filename: "f.bin",
          port: 0,
          position: 1024,
          passive: true,
          token: 99,
          text: 'ACCEPT "f.bin" 0 1024 99',
        },
      },
    ] as const;

    for (const c of cases) {
      const ev = createDcc({
        source: { name: "n", mask: { user: "u", host: "h" } },
        command: "dcc",
        params: { target: "me", arg: c.arg },
      })!;
      assertEquals(ev, c.exp);
    }

    const invalid = [
      'RESUME "f.bin" 0 1024', // passive without token
      'ACCEPT "f.bin" 0 1024', // passive without token
      'RESUME "f.bin" 6000', // missing position
      'RESUME "f.bin" abc 1024', // invalid port
    ];
    for (const arg of invalid) {
      const r = createDcc({
        source: { name: "n", mask: { user: "u", host: "h" } },
        command: "dcc",
        params: { target: "me", arg },
      });
      assertEquals(r, undefined);
    }
  });

  // integration: NOTICE bare DCC must not emit
  test("integration: NOTICE with bare DCC does not emit", async () => {
    const { client, server } = await mock();

    const race = Promise.race([
      client.once("dcc_send").then(() => "emitted"),
      new Promise<string>((resolve) =>
        setTimeout(() => resolve("timeout"), 10)
      ),
    ]);

    server.send(":n!u@h NOTICE me :\x01DCC\x01");
    const result = await race;
    assertEquals(result, "timeout");
  });

  // integration: PRIVMSG -> dcc_send
  test("integration: PRIVMSG DCC SEND emits dcc_send", async () => {
    const { client, server } = await mock();

    server.send(
      ':n!u@h PRIVMSG me :\x01DCC SEND "f.bin" 203.0.113.10 6000 123\x01',
    );
    const m1 = await client.once("dcc_send");
    assertEquals(m1.params.filename, "f.bin");
    assertEquals(m1.params.passive, false);

    server.send(
      ':n!u@h PRIVMSG me :\x01DCC SEND "f2.bin" 203.0.113.10 0 123 7\x01',
    );
    const m2 = await client.once("dcc_send");
    assertEquals(m2.params.passive, true);
    assertEquals(m2.params.token, 7);
  });

  // integration: NOTICE -> dcc_send
  test("integration: NOTICE DCC SEND emits dcc_send", async () => {
    const { client, server } = await mock();

    server.send(
      ':n!u@h NOTICE me :\x01DCC SEND "g.bin" 203.0.113.10 6001 1\x01',
    );
    const m1 = await client.once("dcc_send");
    assertEquals(m1.params.filename, "g.bin");
    assertEquals(m1.params.port, 6001);
  });

  // integration: SCHAT over PRIVMSG and NOTICE -> dcc_chat (tls=true)
  test("integration: SCHAT over PRIVMSG and NOTICE emits dcc_chat (tls=true)", async () => {
    const { client, server } = await mock();

    server.send(":n!u@h PRIVMSG me :\x01DCC SCHAT 203.0.113.10 6000\x01");
    const m1 = await client.once("dcc_chat");
    assertEquals(m1.params.tls, true);
    assertEquals(m1.params.port, 6000);
    assertEquals(m1.params.passive, false);

    server.send(":n!u@h NOTICE me :\x01DCC SCHAT :: 6000 7\x01");
    const m2 = await client.once("dcc_chat");
    assertEquals(m2.params.tls, true);
    assertEquals(m2.params.passive, true);
    assertEquals(m2.params.port, 0);
    assertEquals(m2.params.token, 7);
  });

  // commands: client.dcc() builds payloads, calls ctcp, and returns raw lines
  test("commands: client.dcc() builds payloads and returns raw PRIVMSG lines", async () => {
    const { client } = await mock();

    const calls: Array<{ target: string; command: string; param: string }> = [];
    client.ctcp = ((target: string, command: string, param?: string) => {
      calls.push({ target, command, param: String(param) });
    }) as any;

    // SEND with quoting and IPv4 -> uint32
    const l1 = client.dcc("nick", {
      action: "send",
      args: {
        filename: 'with "quote".txt',
        ip: "203.0.113.10",
        port: 6000,
        size: 123,
      },
    });
    assertEquals(calls[0], {
      target: "nick",
      command: "DCC",
      param: 'SEND "with \\"quote\\".txt" 3405803786 6000 123',
    });
    assertEquals(
      l1,
      'PRIVMSG nick :\x01DCC SEND "with \\"quote\\".txt" 3405803786 6000 123\x01',
    );

    // CHAT with hostname and token
    const l2 = client.dcc("me", {
      action: "chat",
      args: { ip: "Example.COM.", port: 7000, token: 9 },
    });
    assertEquals(calls[1], {
      target: "me",
      command: "DCC",
      param: "CHAT example.com 7000 9",
    });
    assertEquals(l2, "PRIVMSG me :\x01DCC CHAT example.com 7000 9\x01");

    // SCHAT with IPv6 passive and token
    const l3 = client.dcc("me", {
      action: "schat",
      args: { ip: "::", port: 0, token: 7 },
    });
    assertEquals(calls[2], {
      target: "me",
      command: "DCC",
      param: "SCHAT [::] 0 7",
    });
    assertEquals(l3, "PRIVMSG me :\x01DCC SCHAT [::] 0 7\x01");

    // RESUME with quoting
    const l4 = client.dcc("you", {
      action: "resume",
      args: { filename: 'f "x".bin', port: 6001, position: 1024 },
    });
    assertEquals(calls[3], {
      target: "you",
      command: "DCC",
      param: 'RESUME "f \\"x\\".bin" 6001 1024',
    });
    assertEquals(
      l4,
      'PRIVMSG you :\x01DCC RESUME "f \\"x\\".bin" 6001 1024\x01',
    );

    // ACCEPT passive requires token (caller supplies one)
    const l5 = client.dcc("you", {
      action: "accept",
      args: { filename: "f.bin", port: 0, position: 2048, token: 55 },
    });
    assertEquals(calls[4], {
      target: "you",
      command: "DCC",
      param: "ACCEPT f.bin 0 2048 55",
    });
    assertEquals(l5, "PRIVMSG you :\x01DCC ACCEPT f.bin 0 2048 55\x01");

    // SEND with token to cover token spread branch
    const l6 = client.dcc("nick2", {
      action: "send",
      args: {
        filename: "f2.bin",
        ip: "203.0.113.10",
        port: 6002,
        size: 1,
        token: 77,
      },
    });
    assertEquals(calls[5], {
      target: "nick2",
      command: "DCC",
      param: "SEND f2.bin 3405803786 6002 1 77",
    });
    assertEquals(
      l6,
      "PRIVMSG nick2 :\x01DCC SEND f2.bin 3405803786 6002 1 77\x01",
    );

    // RESUME with token to cover token spread branch
    const l7 = client.dcc("nick3", {
      action: "resume",
      args: { filename: "r.bin", port: 6003, position: 4096, token: 5 },
    });
    assertEquals(calls[6], {
      target: "nick3",
      command: "DCC",
      param: "RESUME r.bin 6003 4096 5",
    });
    assertEquals(l7, "PRIVMSG nick3 :\x01DCC RESUME r.bin 6003 4096 5\x01");

    // CHAT with invalid host string must pass through as-is (fmtHost fallback)
    const l8 = client.dcc("nick4", {
      action: "chat",
      args: { ip: "localhost", port: 7001 },
    });
    assertEquals(calls[7], {
      target: "nick4",
      command: "DCC",
      param: "CHAT localhost 7001",
    });
    assertEquals(l8, "PRIVMSG nick4 :\x01DCC CHAT localhost 7001\x01");

    // CHAT with IPv4 placeholder 0.0.0.0 formats as decimal 0
    const l9 = client.dcc("nick5", {
      action: "chat",
      args: { ip: "0.0.0.0", port: 6002 },
    });
    assertEquals(calls[8], {
      target: "nick5",
      command: "DCC",
      param: "CHAT 0 6002",
    });
    assertEquals(l9, "PRIVMSG nick5 :\x01DCC CHAT 0 6002\x01");
  });
});

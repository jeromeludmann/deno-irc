import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/chanmodes", (test) => {
  test("update modes state on RPL_MYINFO", async () => {
    const { client, server } = await mock();

    server.send(
      ":serverhost 004 me serverhost IRC-version iow bopv bkloveqjfI",
    );
    await client.once("myinfo");

    assertEquals(client.state.chanmodes, {
      "b": { type: "a" },
      "o": { type: "b", prefix: "@" },
      "v": { type: "b", prefix: "+" },
      "p": { type: "d" },
    });
  });

  test("override channel modes state on RPL_ISUPPORT", async () => {
    const { client, server } = await mock();
    const defaults = client.state.chanmodes;

    server.send(
      ":serverhost 005 nick CHANMODES=I,k,H,A :are supported by this server",
    );
    await client.once("isupport:chanmodes");

    assertEquals(client.state.chanmodes, {
      ...defaults,
      "I": { type: "a" },
      "k": { type: "b" },
      "H": { type: "c" },
      "A": { type: "d" },
    });
  });

  test("do not override channel modes state if bad value is received", async () => {
    const { client, server } = await mock();
    const defaults = client.state.chanmodes;

    server.send(
      ":serverhost 005 nick CHANMODES :are supported by this server",
    );
    await client.once("isupport:chanmodes");
    assertEquals(client.state.chanmodes, defaults);

    server.send(
      ":serverhost 005 nick CHANMODES=a :are supported by this server",
    );
    await client.once("isupport:chanmodes");
    assertEquals(client.state.chanmodes, defaults);
  });

  test("override channel modes state with PREFIX on RPL_ISUPPORT", async () => {
    const { client, server } = await mock();
    const defaults = client.state.chanmodes;

    server.send(
      ":serverhost 005 nick PREFIX=(qaohv)~&@%+ :are supported by this server",
    );
    await client.once("isupport:prefix");

    assertEquals(client.state.chanmodes, {
      ...defaults,
      "q": { type: "b", prefix: "~" },
      "a": { type: "b", prefix: "&" },
      "o": { type: "b", prefix: "@" },
      "h": { type: "b", prefix: "%" },
      "v": { type: "b", prefix: "+" },
    });
  });

  test("replace nick prefixes state on RPL_ISUPPORT", async () => {
    const { client, server } = await mock();

    server.send(
      ":serverhost 005 nick PREFIX=(ov)@+ :are supported by this server",
    );
    await client.once("isupport:prefix");

    assertEquals(client.state.prefixes, {
      "@": { priority: 0 },
      "+": { priority: 1 },
    });

    server.send(
      ":serverhost 005 nick PREFIX=(qaohv)~&@%+ :are supported by this server",
    );
    await client.once("isupport:prefix");

    assertEquals(client.state.prefixes, {
      "~": { priority: 0 },
      "&": { priority: 1 },
      "@": { priority: 2 },
      "%": { priority: 3 },
      "+": { priority: 4 },
    });
  });

  test("do not replace nick prefixes state if bad value is received", async () => {
    const { client, server } = await mock();
    const defaults = client.state.prefixes;

    // without value

    server.send(":serverhost 005 nick PREFIX :are supported by this server");
    await client.once("isupport:prefix");
    assertEquals(client.state.prefixes, defaults);

    // with bad format

    server.send(":serverhost 005 nick PREFIX=a :are supported by this server");
    await client.once("isupport:prefix");
    assertEquals(client.state.prefixes, defaults);
  });
});

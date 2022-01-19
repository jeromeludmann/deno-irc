import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { getDefaults } from "./isupport.ts";

describe("plugins/isupport", (test) => {
  test("set default user modes state", async () => {
    const { client } = await mock();
    const { supported } = client.state;
    assertEquals(supported.modes.user, getDefaults().modes.user);
  });

  test("set default channel modes state", async () => {
    const { client } = await mock();
    const { supported } = client.state;
    assertEquals(supported.modes.channel, getDefaults().modes.channel);
  });

  test("set default nick prefixes state", async () => {
    const { client } = await mock();
    const { supported } = client.state;
    assertEquals(supported.prefixes, getDefaults().prefixes);
  });

  test("update modes state on RPL_MYINFO", async () => {
    const { client, server } = await mock();
    const { supported } = client.state;

    server.send(
      ":serverhost 004 me serverhost IRC-version iow bopv bkloveqjfI",
    );
    await client.once("myinfo");

    assertEquals(supported.modes, {
      user: {
        "i": { type: "d" },
        "o": { type: "d" },
        "w": { type: "d" },
      },
      channel: {
        "b": { type: "a" },
        "o": { type: "b", prefix: "@" },
        "v": { type: "b", prefix: "+" },
        "p": { type: "d" },
      },
    });
  });

  test("override user modes state on RPL_ISUPPORT", async () => {
    const { client, server } = await mock();
    const { supported } = client.state;

    server.send(
      ":serverhost 005 nick USERMODES=,,s,iow :are supported by this server",
    );
    await client.once("raw");

    assertEquals(supported.modes.user, {
      ...getDefaults().modes.user,
      "s": { type: "c" },
      "i": { type: "d" },
      "o": { type: "d" },
      "w": { type: "d" },
    });
  });

  test("override channel modes state on RPL_ISUPPORT", async () => {
    const { client, server } = await mock();
    const { supported } = client.state;

    server.send(
      ":serverhost 005 nick CHANMODES=I,k,H,A :are supported by this server",
    );
    await client.once("raw");

    assertEquals(supported.modes.channel, {
      ...getDefaults().modes.channel,
      "I": { type: "a" },
      "k": { type: "b" },
      "H": { type: "c" },
      "A": { type: "d" },
    });
  });

  test("override channel modes state with PREFIX on RPL_ISUPPORT", async () => {
    const { client, server } = await mock();
    const { supported } = client.state;

    server.send(
      ":serverhost 005 nick PREFIX=(qaohv)~&@%+ :are supported by this server",
    );
    await client.once("raw");

    assertEquals(supported.modes.channel, {
      ...getDefaults().modes.channel,
      "q": { type: "b", prefix: "~" },
      "a": { type: "b", prefix: "&" },
      "o": { type: "b", prefix: "@" },
      "h": { type: "b", prefix: "%" },
      "v": { type: "b", prefix: "+" },
    });
  });

  test("replace nick prefixes state on RPL_ISUPPORT", async () => {
    const { client, server } = await mock();
    const { supported } = client.state;

    server.send(
      ":serverhost 005 nick PREFIX=(ov)@+ :are supported by this server",
    );
    await client.once("raw");

    assertEquals(supported.prefixes, {
      "@": { priority: 0 },
      "+": { priority: 1 },
    });

    server.send(
      ":serverhost 005 nick PREFIX=(qaohv)~&@%+ :are supported by this server",
    );
    await client.once("raw");

    assertEquals(supported.prefixes, {
      "~": { priority: 0 },
      "&": { priority: 1 },
      "@": { priority: 2 },
      "%": { priority: 3 },
      "+": { priority: 4 },
    });
  });
});

import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/isupport", (test) => {
  test("emit 'isupport:usermodes' on RPL_ISUPPORT", async () => {
    const { client, server } = await mock();

    server.send(
      ":serverhost 005 nick USERMODES=,,s,iow :are supported by this server",
    );
    const msg = await client.once("isupport:usermodes");

    assertEquals(msg, {
      params: { value: ",,s,iow" },
      source: { name: "serverhost" },
    });
  });

  test("emit 'isupport:chanmodes' on RPL_ISUPPORT", async () => {
    const { client, server } = await mock();

    server.send(
      ":serverhost 005 nick CHANMODES=I,k,H,A :are supported by this server",
    );
    const msg = await client.once("isupport:chanmodes");

    assertEquals(msg, {
      params: { value: "I,k,H,A" },
      source: { name: "serverhost" },
    });
  });

  test("emit 'isupport:prefix' on RPL_ISUPPORT", async () => {
    const { client, server } = await mock();

    server.send(
      ":serverhost 005 nick PREFIX=(qaohv)~&@%+ :are supported by this server",
    );
    const msg = await client.once("isupport:prefix");

    assertEquals(msg, {
      params: { value: "(qaohv)~&@%+" },
      source: { name: "serverhost" },
    });
  });

  test("emit 'isupport:*' on RPL_ISUPPORT", async () => {
    const { client, server } = await mock();

    server.send([
      ":serverhost 005 nick USERMODES=,,s,iow PREFIX=(qaohv)~&@%+ :are supported by this server",
      ":serverhost 005 nick CHANMODES=I,k,H,A :are supported by this server",
    ]);
    const messages = await Promise.all([
      client.once("isupport:usermodes"),
      client.once("isupport:chanmodes"),
      client.once("isupport:prefix"),
    ]);

    assertEquals(messages, [{
      params: { value: ",,s,iow" },
      source: { name: "serverhost" },
    }, {
      params: { value: "I,k,H,A" },
      source: { name: "serverhost" },
    }, {
      params: { value: "(qaohv)~&@%+" },
      source: { name: "serverhost" },
    }]);
  });
});

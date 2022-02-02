import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/myinfo", (test) => {
  test("emit 'myinfo' on RPL_MYINFO", async () => {
    const { client, server } = await mock();

    server.send(
      ":serverhost 004 me serverhost IRC-version DGQRSZaghilopsuwz CFILMPQSTbcefgijklmnopqrstuvz bkloveqjfI",
    );
    await client.once("myinfo");

    assertEquals(client.state.server, {
      host: "serverhost",
      version: "IRC-version",
    });
  });

  test("update server state on RPL_MYINFO", async () => {
    const { client, server } = await mock();

    server.send(
      ":serverhost 004 me serverhost IRC-version iouw iklmnoprstv bkloveqjfI",
    );
    const msg = await client.once("myinfo");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: {
        server: { host: "serverhost", version: "IRC-version" },
        usermodes: "iouw",
        chanmodes: "iklmnoprstv",
      },
    });
  });
});

import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { myinfoPlugin } from "./myinfo.ts";

describe("plugins/myinfo", (test) => {
  const plugins = [myinfoPlugin];

  test("emit 'myinfo' on RPL_MYINFO", async () => {
    const { client, server } = await mock(plugins, {});

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
    const { client, server } = await mock(plugins, {});

    server.send(
      ":serverhost 004 me serverhost IRC-version iouw iklmnoprstv bkloveqjfI",
    );
    const msg = await client.once("myinfo");

    assertEquals(msg, {
      server: {
        host: "serverhost",
        version: "IRC-version",
      },
      modes: {
        user: ["i", "o", "u", "w"],
        channel: ["i", "k", "l", "m", "n", "o", "p", "r", "s", "t", "v"],
      },
    });
  });
});

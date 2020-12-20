import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { myinfo } from "./myinfo.ts";

describe("plugins/myinfo", (test) => {
  const plugins = [myinfo];

  test("emit 'myinfo' on RPL_MYINFO", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":serverhost 004 me serverhost IRC-version iorsw ilmop");
    const msg = await client.once("myinfo");

    assertEquals(msg, {
      serverHost: "serverhost",
      serverVersion: "IRC-version",
      availableUserModes: ["i", "o", "r", "s", "w"],
      availableChannelModes: ["i", "l", "m", "o", "p"],
    });
  });

  test("update myinfo state on RPL_MYINFO", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":serverhost 004 me serverhost IRC-version iorsw ilmop");
    await client.once("myinfo");

    const {
      serverHost,
      serverVersion,
      availableUserModes,
      availableChannelModes,
    } = client.state;

    assertEquals(serverHost, "serverhost");
    assertEquals(serverVersion, "IRC-version");
    assertEquals(availableUserModes, ["i", "o", "r", "s", "w"]);
    assertEquals(availableChannelModes, ["i", "l", "m", "o", "p"]);
  });
});

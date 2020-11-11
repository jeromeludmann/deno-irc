import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { myinfo } from "./myinfo.ts";
import { myinfoState } from "./myinfo_state.ts";

describe("plugins/myinfo_state", (test) => {
  const plugins = [myinfoState, myinfo];

  test("update myinfo state on RPL_MYINFO", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":serverhost 004 me serverhost IRC-version iorsw ilmop");
    await client.once("myinfo");

    assertEquals(client.state, {
      serverHost: "serverhost",
      serverVersion: "IRC-version",
      availableUserModes: ["i", "o", "r", "s", "w"],
      availableChannelModes: ["i", "l", "m", "o", "p"],
    });
  });
});

import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { myinfo } from "./myinfo.ts";
import { myinfoState } from "./myinfo_state.ts";

Deno.test("myinfo state", async () => {
  const { server, client, sanitize } = arrange([myinfoState, myinfo], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":serverhost 004 nick serverhost IRC-version iorsw ilmop");
  await client.once("myinfo");
  assertEquals(client.state.serverHost, "serverhost");
  assertEquals(client.state.serverVersion, "IRC-version");
  assertEquals(client.state.availableUserModes, ["i", "o", "r", "s", "w"]);
  assertEquals(client.state.availableChannelModes, ["i", "l", "m", "o", "p"]);

  await sanitize();
});

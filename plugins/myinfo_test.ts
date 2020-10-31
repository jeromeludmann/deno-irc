import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { myinfo } from "./myinfo.ts";

Deno.test("myinfo events", async () => {
  const { server, client, sanitize } = arrange([myinfo], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":serverhost 004 nick2 serverhost IRC-version iorsw ilmop");
  const msg2 = await client.once("myinfo");
  assertEquals(msg2, {
    nick: "nick2",
    serverHost: "serverhost",
    serverVersion: "IRC-version",
    availableUserModes: ["i", "o", "r", "s", "w"],
    availableChannelModes: ["i", "l", "m", "o", "p"],
  });

  await sanitize();
});

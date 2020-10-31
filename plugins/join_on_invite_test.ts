import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { plugin as invite } from "./invite.ts";
import { plugin as join } from "./join.ts";
import { plugin as joinOnInvite } from "./join_on_invite.ts";
import { plugin as nickState } from "./nick_state.ts";

Deno.test("join_on_invite", async () => {
  const { server, client, sanitize } = arrange(
    [joinOnInvite, invite, join, nickState],
    { nick: "nick", joinOnInvite: true },
  );

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick2!user@host INVITE nick :#channel");
  const raw = await server.once("JOIN");
  assertEquals(raw, "JOIN #channel");

  await sanitize();
});

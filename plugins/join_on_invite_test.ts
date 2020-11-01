import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { invite } from "./invite.ts";
import { join } from "./join.ts";
import { joinOnInvite } from "./join_on_invite.ts";
import { userState } from "./user_state.ts";

Deno.test("join_on_invite", async () => {
  const { server, client, sanitize } = arrange(
    [joinOnInvite, invite, join, userState],
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

import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { nick } from "./nick.ts";
import { nickState } from "./nick_state.ts";
import { register } from "./register.ts";
import { registerOnConnect } from "./register_on_connect.ts";

Deno.test("nick state", async () => {
  const { server, client, sanitize } = arrange(
    [nickState, nick, register, registerOnConnect],
    { nick: "nick" },
  );

  assertEquals(client.state.nick, "nick");

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":serverhost 001 nick2 :Welcome to the server");
  await client.once("register");
  assertEquals(client.state.nick, "nick2");

  server.send(":nick4!user@host NICK nick3");
  await client.once("nick");
  assertEquals(client.state.nick, "nick2");

  server.send(":nick2!user@host NICK nick3");
  await client.once("nick");
  assertEquals(client.state.nick, "nick3");

  await sanitize();
});

import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { plugin as nick } from "./nick.ts";
import { plugin as nickState } from "./nick_state.ts";
import { plugin as register } from "./register.ts";
import { plugin as registerOnConnect } from "./register_on_connect.ts";

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

  server.send(":nick2!user@host NICK nick3");
  await client.once("nick");
  assertEquals(client.state.nick, "nick3");

  await sanitize();
});

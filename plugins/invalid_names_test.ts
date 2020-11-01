import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { invalidNames } from "./invalid_names.ts";
import { nick } from "./nick.ts";
import { register } from "./register.ts";
import { userState } from "./user_state.ts";

Deno.test("invalid_names", async () => {
  const { server, client, sanitize } = arrange(
    [invalidNames, userState, nick, register],
    { nick: "nick", resolveInvalidNames: true },
  );

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":serverhost 433 nick nick2 :Nickname is already in use");
  assertEquals((await client.once("raw")).command, "ERR_NICKNAMEINUSE");
  const raw1 = await server.once("NICK");
  assertEquals(raw1, "NICK nick2_");

  server.send(":serverhost 432 nick `^$ :Erroneous nickname");
  assertEquals((await client.once("raw")).command, "ERR_ERRONEUSNICKNAME");
  const raw2 = await server.once("NICK");
  assertEquals(/^NICK _[a-zA-Z0-9]+$/.test(raw2), true);

  server.send(":serverhost 468 * USER :Your username is not valid");
  assertEquals((await client.once("raw")).command, "ERR_INVALIDUSERNAME");
  const raw3 = await server.once("USER");
  assertEquals(/^USER _[a-zA-Z0-9]+ 0 \* nick$/.test(raw3), true);

  await sanitize();
});

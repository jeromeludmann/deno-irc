import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { plugin as join } from "./join.ts";
import { plugin as nick } from "./nick.ts";
import { plugin as onConnect } from "./on_connect.ts";
import { plugin as oper } from "./oper.ts";
import { plugin as register } from "./register.ts";

Deno.test("on_connect channels", async () => {
  const { server, client, sanitize } = arrange(
    [onConnect, join, nick, register],
    { nick: "nick", channels: ["#channel1", "#channel2"] },
  );

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":serverhost 001 nick :Welcome to the server");
  const raw = await server.once("JOIN");
  assertEquals(raw, "JOIN #channel1,#channel2");

  await sanitize();
});

Deno.test("on_connect oper", async () => {
  const { server, client, sanitize } = arrange(
    [onConnect, oper, nick, register],
    { nick: "nick", oper: { user: "user", pass: "pass" } },
  );

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":serverhost 001 nick :Welcome to the server");
  const raw = await server.once("OPER");
  assertEquals(raw, "OPER user pass");

  await sanitize();
});

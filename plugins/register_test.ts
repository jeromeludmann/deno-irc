import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { plugin as nick } from "./nick.ts";
import { plugin as register } from "./register.ts";

Deno.test("register events", async () => {
  const { server, client, sanitize } = arrange(
    [nick, register],
    { nick: "nick" },
  );

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":serverhost 001 nick :Welcome to the server");
  const msg1 = await client.once("register");
  assertEquals(msg1, {
    nick: "nick",
    text: "Welcome to the server",
  });

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

Deno.test("register state", async () => {
  const { server, client, sanitize } = arrange(
    [nick, register],
    {
      nick: "nick",
      username: "user",
      realname: "real name",
      password: "pass",
    },
  );

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":serverhost 001 nick2 :Welcome to the server");
  await client.once("register");
  assertEquals(client.state.nick, "nick2");

  server.send(":serverhost 004 nick2 serverhost IRC-version iorsw ilmop");
  await client.once("myinfo");
  assertEquals(client.state.serverHost, "serverhost");
  assertEquals(client.state.serverVersion, "IRC-version");
  assertEquals(client.state.availableUserModes, ["i", "o", "r", "s", "w"]);
  assertEquals(client.state.availableChannelModes, ["i", "l", "m", "o", "p"]);

  await sanitize();
});

Deno.test("register registration", async () => {
  const { server, client, sanitize } = arrange(
    [nick, register],
    {
      nick: "nick",
      username: "user",
      realname: "real name",
      password: "pass",
    },
  );

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  const raw1 = await Promise.all([
    server.once("PASS"),
    server.once("NICK"),
    server.once("USER"),
  ]);
  assertEquals(raw1, [
    "PASS pass",
    "NICK nick",
    "USER user 0 * :real name",
  ]);

  server.send(":serverhost 451 nick :You have not registered");
  assertEquals((await client.once("raw")).command, "ERR_NOTREGISTERED");
  const raw2 = await Promise.all([
    server.once("PASS"),
    server.once("NICK"),
    server.once("USER"),
  ]);
  assertEquals(raw2, [
    "PASS pass",
    "NICK nick",
    "USER user 0 * :real name",
  ]);

  server.send(":serverhost 433 nick nick2 :Nickname is already in use");
  assertEquals((await client.once("raw")).command, "ERR_NICKNAMEINUSE");
  const raw3 = await server.once("NICK");
  assertEquals(raw3, "NICK nick2_");

  server.send(":serverhost 432 nick `^$ :Erroneous nickname");
  assertEquals((await client.once("raw")).command, "ERR_ERRONEUSNICKNAME");
  const raw4 = await server.once("NICK");
  assertEquals(raw4.startsWith("NICK "), true);

  server.send(":serverhost 468 * USER :Your username is not valid");
  assertEquals((await client.once("raw")).command, "ERR_INVALIDUSERNAME");
  const raw5 = await server.once("USER");
  assertEquals(raw5.startsWith("USER "), true);

  await sanitize();
});

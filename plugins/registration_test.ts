import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { nickPlugin } from "./nick.ts";
import { registerPlugin } from "./register.ts";
import { registrationPlugin } from "./registration.ts";

describe("plugins/registration", (test) => {
  const plugins = [
    nickPlugin,
    registerPlugin,
    registrationPlugin,
  ];

  const options = {
    nick: "me",
    username: "user",
    realname: "real name",
    password: "pass",
  };

  test("register on connect", async () => {
    const { client, server } = await mock(
      plugins,
      options,
      { withConnection: false },
    );

    await client.connect("");
    const raw = server.receive();

    assertEquals(raw, [
      "PASS pass",
      "NICK me",
      "USER user 0 * :real name",
    ]);
  });

  test("register on ERR_NOTREGISTERED", async () => {
    const { client, server } = await mock(plugins, options);
    server.receive();

    server.send(":serverhost 451 me :You have not registered");
    await client.once("raw");
    const raw = server.receive();

    assertEquals(raw, [
      "PASS pass",
      "NICK me",
      "USER user 0 * :real name",
    ]);
  });

  test("initialize user state", async () => {
    const { client } = await mock(plugins, options);

    const { nick, username, realname } = client.state;

    assertEquals(nick, "me");
    assertEquals(username, "user");
    assertEquals(realname, "real name");
  });

  test("update nick on RPL_WELCOME", async () => {
    const { client, server } = await mock(plugins, options);

    server.send(":serverhost 001 new_nick :Welcome to the server");
    await client.once("register");

    assertEquals(client.state.nick, "new_nick");
  });

  test("track nick changes on NICK", async () => {
    const { client, server } = await mock(plugins, options);

    server.send(":me!user@host NICK new_nick");
    await client.once("nick");

    assertEquals(client.state.nick, "new_nick");
  });

  test("not track nick changes on NICK", async () => {
    const { client, server } = await mock(plugins, options);

    server.send(":someone!user@host NICK new_nick");
    await client.once("nick");

    assertEquals(client.state.nick, "me");
  });
});

import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { nick } from "./nick.ts";
import { register } from "./register.ts";
import { registerOnConnect } from "./register_on_connect.ts";
import { userState } from "./user_state.ts";

describe("plugins/user_state", (test) => {
  const plugins = [userState, nick, register, registerOnConnect];
  const options = { nick: "me", username: "user", realname: "real name" };

  test("initialize user state", async () => {
    const { client } = await mock(plugins, options);

    assertEquals(client.state, {
      nick: "me",
      username: "user",
      realname: "real name",
    });
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

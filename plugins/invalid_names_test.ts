import { assertEquals, assertMatch } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { invalidNamesPlugin } from "./invalid_names.ts";
import { nickPlugin } from "./nick.ts";
import { registerPlugin } from "./register.ts";
import { registerOnConnectPlugin } from "./register_on_connect.ts";
import { throwOnErrorPlugin } from "./throw_on_error.ts";

describe("plugins/invalid_names", (test) => {
  const plugins = [
    nickPlugin,
    registerPlugin,
    registerOnConnectPlugin,
    throwOnErrorPlugin,
    invalidNamesPlugin,
  ];

  const options = { nick: "me" };

  test("change nickname on ERR_NICKNAMEINUSE", async () => {
    const { client, server } = await mock(plugins, {
      ...options,
      resolveInvalidNames: true,
    });

    server.send(":serverhost 433 me new_nick :Nickname is already in use");
    await client.once("raw");
    const raw = server.receive();

    assertEquals(raw, ["NICK new_nick_"]);
  });

  test("change nickname on ERR_ERRONEUSNICKNAME", async () => {
    const { client, server } = await mock(plugins, {
      ...options,
      resolveInvalidNames: true,
    });

    server.send(":serverhost 432 me `^$ :Erroneous nickname");
    await client.once("raw");
    const raw = server.receive();

    assertMatch(raw[0], /^NICK _[a-zA-Z0-9]+$/);
  });

  test("change username on ERR_INVALIDUSERNAME", async () => {
    const { client, server } = await mock(plugins, {
      ...options,
      resolveInvalidNames: true,
    });

    server.send(":serverhost 468 * USER :Your username is not valid");
    await client.once("raw");
    const raw = server.receive();

    assertMatch(raw[0], /^USER _[a-zA-Z0-9]+ 0 \* me$/);
  });

  test("not change anything if disabled", async () => {
    const { client, server } = await mock(plugins, {
      ...options,
      resolveInvalidNames: false,
    });

    server.send(":serverhost 433 me new_nick :Nickname is already in use");
    await client.once("raw");
    server.send(":serverhost 432 me `^$ :Erroneous nickname");
    await client.once("raw");
    server.send(":serverhost 468 * USER :Your username is not valid");
    await client.once("raw");
    const raw = server.receive();

    assertEquals(raw, []);
  });
});

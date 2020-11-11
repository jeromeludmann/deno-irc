import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { nick } from "./nick.ts";
import { register } from "./register.ts";
import { registerOnConnect } from "./register_on_connect.ts";

describe("plugins/register_on_connect", (test) => {
  const plugins = [registerOnConnect, nick, register];
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
});

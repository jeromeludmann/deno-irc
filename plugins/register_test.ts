import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { registerPlugin } from "./register.ts";

describe("plugins/register", (test) => {
  const plugins = [registerPlugin];

  test("send USER", async () => {
    const { client, server } = await mock(plugins, {});

    client.user("username", "real name");
    const raw = server.receive();

    assertEquals(raw, ["USER username 0 * :real name"]);
  });

  test("send PASS", async () => {
    const { client, server } = await mock(plugins, {});

    client.pass("password");
    const raw = server.receive();

    assertEquals(raw, ["PASS password"]);
  });

  test("emit 'register' on RPL_WELCOME", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":serverhost 001 me :Welcome to the server");
    const msg = await client.once("register");

    assertEquals(msg, {
      nick: "me",
      text: "Welcome to the server",
    });
  });
});

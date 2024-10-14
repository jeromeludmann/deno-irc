import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/register", (test) => {
  test("send USER", async () => {
    const { client, server } = await mock();

    client.user("username", "real name");
    const raw = server.receive();

    assertEquals(raw, ["USER username 0 * :real name"]);
  });

  test("send PASS", async () => {
    const { client, server } = await mock();

    client.pass("password");
    const raw = server.receive();

    assertEquals(raw, ["PASS password"]);
  });

  test("emit 'register' on RPL_WELCOME", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 001 me :Welcome to the server");
    const msg = await client.once("register");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: { nick: "me", text: "Welcome to the server" },
    });
  });
});

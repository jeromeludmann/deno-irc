import { assertEquals, assertMatch } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/invalid_names", (test) => {
  test("change nickname on ERR_NICKNAMEINUSE", async () => {
    const { client, server } = await mock({ resolveInvalidNames: true });

    server.send(":serverhost 433 me new_nick :Nickname is already in use");
    await client.once("raw:err_nicknameinuse");
    const raw = server.receive();

    assertEquals(raw, ["NICK new_nick_"]);
  });

  test("change nickname on ERR_ERRONEUSNICKNAME", async () => {
    const { client, server } = await mock({ resolveInvalidNames: true });

    server.send(":serverhost 432 me `^$ :Erroneous nickname");
    await client.once("raw:err_erroneusnickname");
    const raw = server.receive();

    assertMatch(raw[0], /^NICK _[a-zA-Z0-9]+$/);
  });

  test("change username on ERR_INVALIDUSERNAME", async () => {
    const { client, server } = await mock({ resolveInvalidNames: true });

    server.send(":serverhost 468 * USER :Your username is not valid");
    await client.once("raw:err_invalidusername");
    const raw = server.receive();

    assertMatch(raw[0], /^USER _[a-zA-Z0-9]+ 0 \* me$/);
  });

  test("not change anything if disabled", async () => {
    const { client, server } = await mock({ resolveInvalidNames: false });

    server.send(":serverhost 433 me new_nick :Nickname is already in use");
    await client.once("raw:err_nicknameinuse");
    server.send(":serverhost 432 me `^$ :Erroneous nickname");
    await client.once("raw:err_erroneusnickname");
    server.send(":serverhost 468 * USER :Your username is not valid");
    await client.once("raw:err_invalidusername");
    const raw = server.receive();

    assertEquals(raw, []);
  });
});

import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/chantypes", (test) => {
  test("check channel with defaults", async () => {
    const { client } = await mock();

    assertEquals(client.utils.isChannel("nick"), false);
    assertEquals(client.utils.isChannel("#channel"), true);
    assertEquals(client.utils.isChannel("&channel"), false);
    assertEquals(client.utils.isChannel("!channel"), false);
    assertEquals(client.utils.isChannel("+channel"), false);
  });

  test("check channel with provided CHANTYPES", async () => {
    const { client, server } = await mock();

    server.send(
      ":serverhost 005 nick CHANTYPES=#&!+ :are supported by this server",
    );
    await client.once("isupport:chantypes");

    assertEquals(client.utils.isChannel("nick"), false);
    assertEquals(client.utils.isChannel("#channel"), true);
    assertEquals(client.utils.isChannel("&channel"), true);
    assertEquals(client.utils.isChannel("!channel"), true);
    assertEquals(client.utils.isChannel("+channel"), true);
  });
});

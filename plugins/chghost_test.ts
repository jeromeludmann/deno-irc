import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/chghost", (test) => {
  test("push 'chghost' capability", async () => {
    const { client } = await mock();

    assertEquals(client.state.capabilities.includes("chghost"), true);
  });

  test("emit 'chghost' on CHGHOST", async () => {
    const { client, server } = await mock();

    server.send(":nick!user@host CHGHOST newuser newhost.example.com");
    const msg = await client.once("chghost");

    assertEquals(msg, {
      source: { name: "nick", mask: { user: "user", host: "host" } },
      params: { username: "newuser", hostname: "newhost.example.com" },
    });
  });
});

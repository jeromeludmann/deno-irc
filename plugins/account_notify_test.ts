import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/account_notify", (test) => {
  test("push 'account-notify' capability", async () => {
    const { client } = await mock();

    assertEquals(
      client.state.caps.requested.includes("account-notify"),
      true,
    );
  });

  test("emit 'account' on ACCOUNT login", async () => {
    const { client, server } = await mock();

    server.send(":nick!user@host ACCOUNT jdoe");
    const msg = await client.once("account");

    assertEquals(msg, {
      source: { name: "nick", mask: { user: "user", host: "host" } },
      params: { account: "jdoe" },
    });
  });

  test("emit 'account' on ACCOUNT logout", async () => {
    const { client, server } = await mock();

    server.send(":nick!user@host ACCOUNT *");
    const msg = await client.once("account");

    assertEquals(msg, {
      source: { name: "nick", mask: { user: "user", host: "host" } },
      params: { account: "*" },
    });
  });
});

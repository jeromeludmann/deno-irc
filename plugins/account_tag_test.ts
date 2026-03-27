import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/account_tag", (test) => {
  test("push 'account-tag' capability", async () => {
    const { client } = await mock();

    assertEquals(
      client.state.caps.requested.includes("account-tag"),
      true,
    );
  });

  test("extract account from message tags", async () => {
    const { client, server } = await mock();

    server.send("@account=jdoe :nick!user@host PRIVMSG #chan :hello");
    const msg = await client.once("raw:privmsg");
    const account = client.utils.getAccount(msg);

    assertEquals(account, "jdoe");
  });

  test("return undefined when no account tag", async () => {
    const { client, server } = await mock();

    server.send(":nick!user@host PRIVMSG #chan :hello");
    const msg = await client.once("raw:privmsg");
    const account = client.utils.getAccount(msg);

    assertEquals(account, undefined);
  });
});

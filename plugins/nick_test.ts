import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/nick", (test) => {
  test("send NICK", async () => {
    const { client, server } = await mock();

    client.nick("new_nick");
    const raw = server.receive();

    assertEquals(raw, ["NICK new_nick"]);
  });

  test("emit 'nick' on NICK", async () => {
    const { client, server } = await mock();

    server.send(":someone!user@host NICK me");
    const msg = await client.once("nick");

    assertEquals(msg, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { nick: "me" },
    });
  });
});

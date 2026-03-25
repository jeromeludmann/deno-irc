import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/away_notify", (test) => {
  test("push 'away-notify' capability", async () => {
    const { client } = await mock();

    assertEquals(client.state.capabilities.includes("away-notify"), true);
  });

  test("emit 'away_notify' when user goes away", async () => {
    const { client, server } = await mock();

    server.send(":nick!user@host AWAY :I'm busy");
    const msg = await client.once("away_notify");

    assertEquals(msg, {
      source: { name: "nick", mask: { user: "user", host: "host" } },
      params: { away: true, message: "I'm busy" },
    });
  });

  test("emit 'away_notify' when user comes back", async () => {
    const { client, server } = await mock();

    server.send(":nick!user@host AWAY");
    const msg = await client.once("away_notify");

    assertEquals(msg, {
      source: { name: "nick", mask: { user: "user", host: "host" } },
      params: { away: false, message: undefined },
    });
  });
});

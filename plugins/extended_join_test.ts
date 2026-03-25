import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/extended_join", (test) => {
  test("push 'extended-join' capability", async () => {
    const { client } = await mock();

    assertEquals(client.state.capabilities.includes("extended-join"), true);
  });

  test("emit 'extended_join' with account and realname", async () => {
    const { client, server } = await mock();

    server.send(":nick!user@host JOIN #channel jdoe :John Doe");
    const msg = await client.once("extended_join");

    assertEquals(msg, {
      source: { name: "nick", mask: { user: "user", host: "host" } },
      params: { channel: "#channel", account: "jdoe", realname: "John Doe" },
    });
  });

  test("emit 'extended_join' with * account (not logged in)", async () => {
    const { client, server } = await mock();

    server.send(":nick!user@host JOIN #channel * :Real Name");
    const msg = await client.once("extended_join");

    assertEquals(msg, {
      source: { name: "nick", mask: { user: "user", host: "host" } },
      params: { channel: "#channel", account: "*", realname: "Real Name" },
    });
  });

  test("do not emit 'extended_join' for standard JOIN", async () => {
    const { client, server } = await mock();

    let triggered = false;
    client.on("extended_join", () => {
      triggered = true;
    });

    server.send(":nick!user@host JOIN #channel");
    await client.once("join");

    assertEquals(triggered, false);
  });

  test("still emit normal 'join' event alongside 'extended_join'", async () => {
    const { client, server } = await mock();

    const joinPromise = client.once("join");
    server.send(":nick!user@host JOIN #channel jdoe :John Doe");
    const msg = await joinPromise;

    assertEquals(msg.params.channel, "#channel");
  });
});

import { assertEquals } from "../deps.ts";
import { delay, describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/antiflood", (test) => {
  test("send two PRIVMSG with delay", async () => {
    const { client, server } = await mock({ floodDelay: 10 });

    client.privmsg("#channel", "Hello world");
    client.privmsg("#channel", "Hello world, again");
    let raw = server.receive();

    // Should only get first message
    assertEquals(raw, [
      "PRIVMSG #channel :Hello world",
    ]);

    // Wait for second message to make it through
    await delay(100);
    raw = server.receive();

    // Second message now dispatched to server
    assertEquals(raw, [
      "PRIVMSG #channel :Hello world, again",
    ]);
  });
});

describe("plugins/antiflood", (test) => {
  test("disabled when delay not set", async () => {
    const { client, server } = await mock();

    client.privmsg("#channel", "Hello world");
    client.privmsg("#channel", "Hello world, again");
    const raw = server.receive();

    // Should get both messages
    assertEquals(raw, [
      "PRIVMSG #channel :Hello world",
      "PRIVMSG #channel :Hello world, again",
    ]);
  });
});

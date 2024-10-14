import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/privmsg", (test) => {
  test("send PRIVMSG", async () => {
    const { client, server } = await mock();

    client.privmsg("#channel", "Hello world");
    client.msg("someone", "Hello world");
    const raw = server.receive();

    assertEquals(raw, [
      "PRIVMSG #channel :Hello world",
      "PRIVMSG someone :Hello world",
    ]);
  });

  test("emit 'privmsg' on PRIVMSG", async () => {
    const { client, server } = await mock();
    const messages = [];

    server.send(":someone!user@host PRIVMSG #channel :Hello world");
    messages.push(await client.once("privmsg"));

    server.send(":someone!user@host PRIVMSG me :Hello world");
    messages.push(await client.once("privmsg"));

    assertEquals(messages, [
      {
        source: { name: "someone", mask: { user: "user", host: "host" } },
        params: { target: "#channel", text: "Hello world" },
      },
      {
        source: { name: "someone", mask: { user: "user", host: "host" } },
        params: { target: "me", text: "Hello world" },
      },
    ]);
  });

  test("emit 'privmsg:channel' on PRIVMSG from channel", async () => {
    const { client, server } = await mock();

    server.send(":someone!user@host PRIVMSG #channel :Hello world");
    const msg = await client.once("privmsg:channel");

    assertEquals(msg, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "#channel", text: "Hello world" },
    });
  });

  test("emit 'privmsg:private' on PRIVMSG from nick", async () => {
    const { client, server } = await mock();

    server.send(":someone!user@host PRIVMSG me :Hello world");
    const msg = await client.once("privmsg:private");

    assertEquals(msg, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "me", text: "Hello world" },
    });
  });
});

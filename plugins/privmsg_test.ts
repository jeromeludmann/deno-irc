import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { privmsgPlugin } from "./privmsg.ts";

describe("plugins/privmsg", (test) => {
  const plugins = [privmsgPlugin];

  test("send PRIVMSG", async () => {
    const { client, server } = await mock(plugins, {});

    client.msg("#channel", "Hello world");
    client.msg("someone", "Hello world");
    const raw = server.receive();

    assertEquals(raw, [
      "PRIVMSG #channel :Hello world",
      "PRIVMSG someone :Hello world",
    ]);
  });

  test("emit 'privmsg' on PRIVMSG", async () => {
    const { client, server } = await mock(plugins, {});
    const messages = [];

    server.send(":someone!user@host PRIVMSG #channel :Hello world");
    messages.push(await client.once("privmsg"));

    server.send(":someone!user@host PRIVMSG me :Hello world");
    messages.push(await client.once("privmsg"));

    assertEquals(messages, [
      {
        origin: { nick: "someone", username: "user", userhost: "host" },
        target: "#channel",
        text: "Hello world",
      },
      {
        origin: { nick: "someone", username: "user", userhost: "host" },
        target: "me",
        text: "Hello world",
      },
    ]);
  });

  test("emit 'privmsg:channel' on PRIVMSG from channel", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host PRIVMSG #channel :Hello world");
    const msg = await client.once("privmsg:channel");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      channel: "#channel",
      text: "Hello world",
    });
  });

  test("emit 'privmsg:private' on PRIVMSG from nick", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host PRIVMSG me :Hello world");
    const msg = await client.once("privmsg:private");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      text: "Hello world",
    });
  });
});

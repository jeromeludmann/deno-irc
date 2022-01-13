import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { noticePlugin } from "./notice.ts";

describe("plugins/notice", (test) => {
  const plugins = [noticePlugin];

  test("send NOTICE", async () => {
    const { client, server } = await mock(plugins, {});

    client.notice("#channel", "Hello world");
    client.notice("someone", "Hello world");
    const raw = server.receive();

    assertEquals(raw, [
      "NOTICE #channel :Hello world",
      "NOTICE someone :Hello world",
    ]);
  });

  test("emit 'notice' on NOTICE", async () => {
    const { client, server } = await mock(plugins, {});
    const messages = [];

    server.send(":serverhost NOTICE * :*** Looking up your hostname...");
    messages.push(await client.once("notice"));

    server.send(":someone!user@host NOTICE #channel :Hello world");
    messages.push(await client.once("notice"));

    server.send(":someone!user@host NOTICE me :Hello world");
    messages.push(await client.once("notice"));

    assertEquals(messages, [
      {
        prefix: "serverhost",
        target: "*",
        text: "*** Looking up your hostname...",
      },
      {
        prefix: "someone!user@host",
        target: "#channel",
        text: "Hello world",
      },
      {
        prefix: "someone!user@host",
        target: "me",
        text: "Hello world",
      },
    ]);
  });

  test("emit 'notice:server' on NOTICE from server", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":serverhost NOTICE * :*** Looking up your hostname...");
    const msg = await client.once("notice:server");

    assertEquals(msg, {
      origin: "serverhost",
      text: "*** Looking up your hostname...",
    });
  });

  test("emit 'notice:channel' on NOTICE from channel", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host NOTICE #channel :Hello world");
    const msg = await client.once("notice:channel");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      channel: "#channel",
      text: "Hello world",
    });
  });

  test("emit 'notice:private' on NOTICE from nick", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host NOTICE me :Hello world");
    const msg = await client.once("notice:private");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      text: "Hello world",
    });
  });
});

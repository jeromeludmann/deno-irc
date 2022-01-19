import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/notice", (test) => {
  test("send NOTICE", async () => {
    const { client, server } = await mock();

    client.notice("#channel", "Hello world");
    client.notice("someone", "Hello world");
    const raw = server.receive();

    assertEquals(raw, [
      "NOTICE #channel :Hello world",
      "NOTICE someone :Hello world",
    ]);
  });

  test("emit 'notice' on NOTICE", async () => {
    const { client, server } = await mock();
    const messages = [];

    server.send(":serverhost NOTICE * :*** Looking up your hostname...");
    messages.push(await client.once("notice"));

    server.send(":someone!user@host NOTICE #channel :Hello world");
    messages.push(await client.once("notice"));

    server.send(":someone!user@host NOTICE me :Hello world");
    messages.push(await client.once("notice"));

    assertEquals(messages, [
      {
        source: { name: "serverhost" },
        params: { target: "*", text: "*** Looking up your hostname..." },
      },
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

  test("emit 'notice:channel' on NOTICE from channel", async () => {
    const { client, server } = await mock();

    server.send(":someone!user@host NOTICE #channel :Hello world");
    const msg = await client.once("notice:channel");

    assertEquals(msg, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "#channel", text: "Hello world" },
    });
  });

  test("emit 'notice:private' on NOTICE from nick", async () => {
    const { client, server } = await mock();

    server.send(":someone!user@host NOTICE me :Hello world");
    const msg = await client.once("notice:private");

    assertEquals(msg, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "me", text: "Hello world" },
    });
  });
});

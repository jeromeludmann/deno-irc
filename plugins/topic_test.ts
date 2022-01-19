import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/topic", (test) => {
  test("send TOPIC", async () => {
    const { client, server } = await mock();

    client.topic("#channel");
    client.topic("#channel", "New topic for #channel");
    const raw = server.receive();

    assertEquals(raw, [
      "TOPIC #channel",
      "TOPIC #channel :New topic for #channel",
    ]);
  });

  test("emit 'topic_change' on TOPIC", async () => {
    const { client, server } = await mock();

    server.send(":someone!user@host TOPIC #channel :Welcome to #channel");
    const msg = await client.once("topic_change");

    assertEquals(msg, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { channel: "#channel", topic: "Welcome to #channel" },
    });
  });

  test("emit 'topic_set' on RPL_TOPIC", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 332 me #channel :Welcome to #channel");
    const msg = await client.once("topic_set");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: { channel: "#channel", topic: "Welcome to #channel" },
    });
  });

  test("emit 'topic_set' on RPL_NOTOPIC", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 331 me #channel :No topic is set");
    const msg = await client.once("topic_set");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: { channel: "#channel", topic: undefined },
    });
  });

  test("emit 'topic_set_by' on RPL_TOPICWHOTIME", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 333 me #channel someone!user@host :1596564019");
    const msg = await client.once("topic_set_by");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: {
        channel: "#channel",
        who: { name: "someone", mask: { user: "user", host: "host" } },
        time: new Date(1596564019 * 1000),
      },
    });
  });
});

import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { topic } from "./topic.ts";

describe("plugins/topic", (test) => {
  const plugins = [topic];

  test("send TOPIC", async () => {
    const { client, server } = await mock(plugins, {});

    client.topic("#channel");
    client.topic("#channel", "New topic for #channel");
    const raw = server.receive();

    assertEquals(raw, [
      "TOPIC #channel",
      "TOPIC #channel :New topic for #channel",
    ]);
  });

  test("emit 'topic_change' on TOPIC", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host TOPIC #channel :Welcome to #channel");
    const msg = await client.once("topic_change");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      channel: "#channel",
      topic: "Welcome to #channel",
    });
  });

  test("emit 'topic_set' on RPL_TOPIC", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":serverhost 332 me #channel :Welcome to #channel");
    const msg = await client.once("topic_set");

    assertEquals(msg, {
      channel: "#channel",
      topic: "Welcome to #channel",
    });
  });

  test("emit 'topic_set' on RPL_NOTOPIC", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":serverhost 331 me #channel :No topic is set");
    const msg = await client.once("topic_set");

    assertEquals(msg, {
      channel: "#channel",
      topic: undefined,
    });
  });

  test("emit 'topic_set_by' on RPL_TOPICWHOTIME", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":serverhost 333 me #channel someone!user@host :1596564019");
    const msg = await client.once("topic_set_by");

    assertEquals(msg, {
      channel: "#channel",
      who: "someone!user@host",
      time: new Date(1596564019 * 1000),
    });
  });
});

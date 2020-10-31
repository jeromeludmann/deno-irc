import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { topic } from "./topic.ts";

Deno.test("topic commands", async () => {
  const { server, client, sanitize } = arrange([topic], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.topic("#channel");
  const raw1 = await server.once("TOPIC");
  assertEquals(raw1, "TOPIC #channel");

  client.topic("#channel", "New topic for #channel");
  const raw2 = await server.once("TOPIC");
  assertEquals(raw2, "TOPIC #channel :New topic for #channel");

  await sanitize();
});

Deno.test("topic events", async () => {
  const { server, client, sanitize } = arrange([topic], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick!user@host TOPIC #channel :Welcome to #channel");
  const msg1 = await client.once("topic_change");
  assertEquals(msg1, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    channel: "#channel",
    topic: "Welcome to #channel",
  });

  server.send(":serverhost 332 nick #channel :Welcome to #channel");
  const msg2 = await client.once("topic_set");
  assertEquals(msg2, {
    channel: "#channel",
    topic: "Welcome to #channel",
  });

  server.send(":serverhost 331 nick #channel :No topic is set");
  const msg3 = await client.once("topic_set");
  assertEquals(msg3, {
    channel: "#channel",
    topic: undefined,
  });

  server.send(":serverhost 333 nick #channel nick!user@host :1596564019");
  const msg4 = await client.once("topic_set_by");
  assertEquals(msg4, {
    channel: "#channel",
    who: "nick!user@host",
    time: new Date(1596564019 * 1000),
  });

  await sanitize();
});

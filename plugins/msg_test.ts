import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { msg } from "./msg.ts";

Deno.test("msg commands", async () => {
  const { server, client, sanitize } = arrange([msg], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.msg("#channel", "Hello world");
  const raw = await server.once("PRIVMSG");
  assertEquals(raw, "PRIVMSG #channel :Hello world");

  await sanitize();
});

Deno.test("msg events", async () => {
  const { server, client, sanitize } = arrange([msg], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick!user@host PRIVMSG #channel :Hello world");
  const events1 = await Promise.all([
    client.once("msg"),
    client.once("msg:channel"),
  ]);
  assertEquals(events1, [{
    origin: { nick: "nick", username: "user", userhost: "host" },
    target: "#channel",
    text: "Hello world",
  }, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    channel: "#channel",
    text: "Hello world",
  }]);

  server.send(":nick!user@host PRIVMSG nick2 :Hello world");
  const events2 = await Promise.all([
    client.once("msg"),
    client.once("msg:private"),
  ]);
  assertEquals(events2, [{
    origin: { nick: "nick", username: "user", userhost: "host" },
    target: "nick2",
    text: "Hello world",
  }, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    text: "Hello world",
  }]);

  await sanitize();
});

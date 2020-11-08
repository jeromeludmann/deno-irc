import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { privmsg } from "./privmsg.ts";

Deno.test("privmsg commands", async () => {
  const { server, client, sanitize } = arrange([privmsg], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.msg("#channel", "Hello world");
  const raw = await server.once("PRIVMSG");
  assertEquals(raw, "PRIVMSG #channel :Hello world");

  await sanitize();
});

Deno.test("privmsg events", async () => {
  const { server, client, sanitize } = arrange([privmsg], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick!user@host PRIVMSG #channel :Hello world");
  const [msg1, msg2] = await Promise.all([
    client.once("privmsg"),
    client.once("privmsg:channel"),
  ]);
  assertEquals(msg1, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    target: "#channel",
    text: "Hello world",
  });
  assertEquals(msg2, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    channel: "#channel",
    text: "Hello world",
  });

  server.send(":nick!user@host PRIVMSG nick2 :Hello world");
  const [msg3, msg4] = await Promise.all([
    client.once("privmsg"),
    client.once("privmsg:private"),
  ]);
  assertEquals(msg3, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    target: "nick2",
    text: "Hello world",
  });
  assertEquals(msg4, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    text: "Hello world",
  });

  await sanitize();
});

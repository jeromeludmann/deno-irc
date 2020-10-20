import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { plugin as notice } from "./notice.ts";

Deno.test("notice commands", async () => {
  const { server, client, sanitize } = arrange([notice], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.notice("#channel", "Hello world");
  const raw = await server.once("NOTICE");
  assertEquals(raw, "NOTICE #channel :Hello world");

  await sanitize();
});

Deno.test("notice events", async () => {
  const { server, client, sanitize } = arrange([notice], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":serverhost NOTICE * :*** Looking up your hostname...");
  const events1 = await Promise.all([
    client.once("notice"),
    client.once("notice:server"),
  ]);
  assertEquals(events1, [{
    prefix: "serverhost",
    target: "*",
    text: "*** Looking up your hostname...",
  }, {
    origin: "serverhost",
    text: "*** Looking up your hostname...",
  }]);

  server.send(":nick!user@host NOTICE #channel :Hello world");
  const events2 = await Promise.all([
    client.once("notice"),
    client.once("notice:channel"),
  ]);
  assertEquals(events2, [{
    prefix: "nick!user@host",
    target: "#channel",
    text: "Hello world",
  }, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    channel: "#channel",
    text: "Hello world",
  }]);

  server.send(":nick!user@host NOTICE nick2 :Hello world");
  const messages3 = await Promise.all([
    client.once("notice"),
    client.once("notice:private"),
  ]);
  assertEquals(messages3, [{
    prefix: "nick!user@host",
    target: "nick2",
    text: "Hello world",
  }, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    text: "Hello world",
  }]);

  await sanitize();
});

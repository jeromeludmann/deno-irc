import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { plugin as kick } from "./kick.ts";

Deno.test("kick commands", async () => {
  const { server, client, sanitize } = arrange([kick], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.kick("#channel", "nick");
  const raw1 = await server.once("KICK");
  assertEquals(raw1, "KICK #channel nick");

  client.kick("#channel", "nick", "Boom!");
  const raw2 = await server.once("KICK");
  assertEquals(raw2, "KICK #channel nick Boom!");

  await sanitize();
});

Deno.test("kick events", async () => {
  const { server, client, sanitize } = arrange([kick], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick!user@host KICK #channel nick2");
  const msg1 = await client.once("kick");

  assertEquals(msg1, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    channel: "#channel",
    nick: "nick2",
    comment: undefined,
  });

  server.send(":nick!user@host KICK #channel nick2 :Boom!");
  const msg2 = await client.once("kick");
  assertEquals(msg2, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    channel: "#channel",
    nick: "nick2",
    comment: "Boom!",
  });

  await sanitize();
});

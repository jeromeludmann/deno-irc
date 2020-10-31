import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { join } from "./join.ts";

Deno.test("join commands", async () => {
  const { server, client, sanitize } = arrange([join], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.join("#channel");
  const raw1 = await server.once("JOIN");
  assertEquals(raw1, "JOIN #channel");

  client.join("#channel1", "#channel2");
  const raw2 = await server.once("JOIN");
  assertEquals(raw2, "JOIN #channel1,#channel2");

  await sanitize();
});

Deno.test("join events", async () => {
  const { server, client, sanitize } = arrange([join], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick!user@host JOIN #channel");
  const msg = await client.once("join");
  assertEquals(msg, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    channel: "#channel",
  });

  await sanitize();
});

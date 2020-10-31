import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { part } from "./part.ts";

Deno.test("part commands", async () => {
  const { server, client, sanitize } = arrange([part], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.part("#channel");
  const raw1 = await server.once("PART");
  assertEquals(raw1, "PART #channel");

  client.part("#channel", "Goodbye!");
  const raw2 = await server.once("PART");
  assertEquals(raw2, "PART #channel Goodbye!");

  await sanitize();
});

Deno.test("part events", async () => {
  const { server, client, sanitize } = arrange([part], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick!user@host PART #channel");
  const msg1 = await client.once("part");
  assertEquals(msg1, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    channel: "#channel",
    comment: undefined,
  });

  server.send(":nick!user@host PART #channel :Goodbye!");
  const msg2 = await client.once("part");
  assertEquals(msg2, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    channel: "#channel",
    comment: "Goodbye!",
  });

  await sanitize();
});

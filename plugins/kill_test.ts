import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { kill } from "./kill.ts";

Deno.test("kill commands", async () => {
  const { server, client, sanitize } = arrange([kill], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.kill("nick", "Boom!");
  const raw1 = await server.once("KILL");
  assertEquals(raw1, "KILL nick Boom!");

  await sanitize();
});

Deno.test("kill events", async () => {
  const { server, client, sanitize } = arrange([kill], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick!user@host KILL nick2 Boom!");
  const msg = await client.once("kill");
  assertEquals(msg, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    nick: "nick2",
    comment: "Boom!",
  });

  await sanitize();
});

import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { plugin as invite } from "./invite.ts";

Deno.test("invite commands", async () => {
  const { server, client, sanitize } = arrange([invite], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.invite("nick2", "#channel");
  const raw = await server.once("INVITE");
  assertEquals(raw, "INVITE nick2 #channel");

  await sanitize();
});

Deno.test("invite events", async () => {
  const { server, client, sanitize } = arrange([invite], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick!user@host INVITE nick2 :#channel");
  const msg = await client.once("invite");
  assertEquals(msg, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    nick: "nick2",
    channel: "#channel",
  });

  await sanitize();
});

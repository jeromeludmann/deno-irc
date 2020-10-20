import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { plugin as action } from "./action.ts";
import { plugin as ctcp } from "./ctcp.ts";

Deno.test("action commands", async () => {
  const { server, client, sanitize } = arrange([ctcp, action], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.action("#channel", "says hello");
  const raw1 = await server.once("PRIVMSG");
  assertEquals(raw1, "PRIVMSG #channel :\u0001ACTION says hello\u0001");

  client.me("#channel", "says hello");
  const raw2 = await server.once("PRIVMSG");
  assertEquals(raw2, "PRIVMSG #channel :\u0001ACTION says hello\u0001");

  await sanitize();
});

Deno.test("action events", async () => {
  const { server, client, sanitize } = arrange([ctcp, action], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(
    ":nick!user@host PRIVMSG #channel :\u0001ACTION says hello\u0001",
  );
  const msg = await client.once("ctcp_action");
  assertEquals(msg, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    target: "#channel",
    text: "says hello",
  });

  await sanitize();
});

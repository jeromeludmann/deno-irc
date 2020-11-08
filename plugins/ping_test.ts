import { assertEquals, assertMatch } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { ctcp } from "./ctcp.ts";
import { ping } from "./ping.ts";

Deno.test("ping commands", async () => {
  const { server, client, sanitize } = arrange([ctcp, ping], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.ping();
  const raw1 = await server.once("PING");
  assertMatch(raw1, /^PING .+$/);

  client.ping("#channel");
  const raw2 = await server.once("PRIVMSG");
  assertMatch(raw2, /^PRIVMSG #channel :\u0001PING .+\u0001$/);

  await sanitize();
});

Deno.test("ping events", async () => {
  const { server, client, sanitize } = arrange([ping, ctcp], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send("PING :key");
  const msg1 = await client.once("ping");
  assertEquals(msg1, { keys: ["key"] });

  server.send(":nick!user@host PRIVMSG #channel :\u0001PING key\u0001");
  const msg2 = await client.once("ctcp_ping");
  assertEquals(msg2, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    target: "#channel",
    key: "key",
  });

  server.send(":nick2!user@host NOTICE nick :\u0001PING key\u0001");
  const msg3 = await client.once("ctcp_ping_reply");
  assertEquals(msg3, {
    origin: { nick: "nick2", username: "user", userhost: "host" },
    target: "nick",
    key: "key",
  });

  await sanitize();
});

Deno.test("ping replies", async () => {
  const { server, client, sanitize } = arrange([ctcp, ping], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send("PING :key");
  const raw1 = await server.once("PONG");
  assertEquals(raw1, "PONG key");

  server.send(":nick2!user@host PRIVMSG nick :\u0001PING key\u0001");
  const raw2 = await server.once("NOTICE");
  assertEquals(raw2, "NOTICE nick2 :\u0001PING key\u0001");

  await sanitize();
});

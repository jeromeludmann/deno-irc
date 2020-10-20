import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { plugin as ctcp } from "./ctcp.ts";
import { plugin as version } from "./version.ts";

Deno.test("version commands", async () => {
  const { server, client, sanitize } = arrange([ctcp, version], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.version();
  const raw1 = await server.once("VERSION");
  assertEquals(raw1, "VERSION");

  client.version("#channel");
  const raw2 = await server.once("PRIVMSG");
  assertEquals(raw2, "PRIVMSG #channel \u0001VERSION\u0001");

  await sanitize();
});

Deno.test("version events", async () => {
  const { server, client, sanitize } = arrange([ctcp, version], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick!user@host PRIVMSG #channel :\u0001VERSION\u0001");
  const msg1 = await client.once("ctcp_version");
  assertEquals(msg1, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    target: "#channel",
  });

  server.send(
    ":nick2!user@host NOTICE nick :\u0001VERSION deno-irc\u0001",
  );
  const msg2 = await client.once("ctcp_version_reply");
  assertEquals(msg2, {
    origin: { nick: "nick2", username: "user", userhost: "host" },
    target: "nick",
    version: "deno-irc",
  });

  await sanitize();
});

Deno.test("version replies", async () => {
  const { server, client, sanitize } = arrange([ctcp, version], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick2!user@host PRIVMSG nick :\u0001VERSION\u0001");
  const raw = await server.once("NOTICE");
  assertEquals(raw, "NOTICE nick2 :\u0001VERSION deno-irc\u0001");

  await sanitize();
});

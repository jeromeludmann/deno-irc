import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { clientinfo } from "./clientinfo.ts";
import { ctcp } from "./ctcp.ts";

Deno.test("clientinfo commands", async () => {
  const { server, client, sanitize } = arrange([ctcp, clientinfo], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.clientinfo("#channel");
  const raw = await server.once("PRIVMSG");
  assertEquals(raw, "PRIVMSG #channel \u0001CLIENTINFO\u0001");

  await sanitize();
});

Deno.test("clientinfo events", async () => {
  const { server, client, sanitize } = arrange([ctcp, clientinfo], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick!user@host PRIVMSG #channel :\u0001CLIENTINFO\u0001");
  const msg1 = await client.once("ctcp_clientinfo");
  assertEquals(msg1, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    target: "#channel",
  });

  server.send(
    ":nick2!user@host NOTICE nick :\u0001CLIENTINFO PING TIME VERSION\u0001",
  );
  const msg2 = await client.once("ctcp_clientinfo_reply");
  assertEquals(msg2, {
    origin: { nick: "nick2", username: "user", userhost: "host" },
    target: "nick",
    supported: ["PING", "TIME", "VERSION"],
  });

  await sanitize();
});

Deno.test("clientinfo replies", async () => {
  const { server, client, sanitize } = arrange(
    [ctcp, clientinfo],
    { ctcpReplies: { clientinfo: true } },
  );

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick2!user@host PRIVMSG nick :\u0001CLIENTINFO\u0001");
  const raw1 = await server.once("NOTICE");
  assertEquals(raw1, "NOTICE nick2 :\u0001CLIENTINFO PING TIME VERSION\u0001");

  await sanitize();
});

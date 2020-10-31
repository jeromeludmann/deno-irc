import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { ctcp } from "./ctcp.ts";
import { time } from "./time.ts";

Deno.test("time commands", async () => {
  const { server, client, sanitize } = arrange([ctcp, time], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.time();
  const raw1 = await server.once("TIME");
  assertEquals(raw1, "TIME");

  client.time("#channel");
  const raw2 = await server.once("PRIVMSG");
  assertEquals(raw2, "PRIVMSG #channel \u0001TIME\u0001");

  await sanitize();
});

Deno.test("time events", async () => {
  const { server, client, sanitize } = arrange([ctcp, time], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick!user@host PRIVMSG #channel :\u0001TIME\u0001");
  const msg1 = await client.once("ctcp_time");
  assertEquals(msg1, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    target: "#channel",
  });

  server.send(
    ":nick2!user@host NOTICE nick :\u0001TIME Tue Sep 01 2020 20:17:48 GMT+0200 (CEST)\u0001",
  );
  const msg2 = await client.once("ctcp_time_reply");
  assertEquals(msg2, {
    origin: { nick: "nick2", username: "user", userhost: "host" },
    target: "nick",
    time: "Tue Sep 01 2020 20:17:48 GMT+0200 (CEST)",
  });

  await sanitize();
});

Deno.test("time replies", async () => {
  const { server, client, sanitize } = arrange([ctcp, time], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick2!user@host PRIVMSG nick :\u0001TIME\u0001");
  const raw = await server.once("NOTICE");
  assertEquals(raw.startsWith("NOTICE nick2 :\u0001TIME "), true);

  await sanitize();
});

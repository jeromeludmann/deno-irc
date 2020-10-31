import type { Raw } from "../core/mod.ts";
import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { ctcp, isCtcp } from "./ctcp.ts";

Deno.test("ctcp commands", async () => {
  const { server, client, sanitize } = arrange([ctcp], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.ctcp("#channel", "TIME");
  const raw1 = await server.once("PRIVMSG");
  assertEquals(raw1, "PRIVMSG #channel \u0001TIME\u0001");

  client.ctcp("#channel", "ACTION", "param");
  const raw2 = await server.once("PRIVMSG");
  assertEquals(raw2, "PRIVMSG #channel :\u0001ACTION param\u0001");

  await sanitize();
});

Deno.test("ctcp events", async () => {
  const { server, client, sanitize } = arrange([ctcp], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick!user@host PRIVMSG #channel :\u0001COMMAND\u0001");
  const msg1 = await client.once("raw:ctcp");
  assertEquals(msg1, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    target: "#channel",
    command: "COMMAND",
    type: "query",
  });

  server.send(":nick!user@host NOTICE #channel :\u0001COMMAND param\u0001");
  const msg2 = await client.once("raw:ctcp");
  assertEquals(msg2, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    target: "#channel",
    command: "COMMAND",
    type: "reply",
    param: "param",
  });

  await sanitize();
});

Deno.test("ctcp isCtcp", () => {
  assertEquals(
    isCtcp({
      command: "PRIVMSG",
      params: ["nick", "Hello world"],
    } as Raw),
    false,
  );

  assertEquals(
    isCtcp({
      command: "NOTICE",
      params: ["nick", "Hello world"],
    } as Raw),
    false,
  );

  assertEquals(
    isCtcp({
      command: "JOIN",
      params: ["#channel"],
    } as Raw),
    false,
  );

  assertEquals(
    isCtcp({
      command: "PART",
      params: ["#channel", "Goodbye!"],
    } as Raw),
    false,
  );

  assertEquals(
    isCtcp({
      command: "PRIVMSG",
      params: ["nick", "\u0001Hello world\u0001"],
    } as Raw),
    true,
  );

  assertEquals(
    isCtcp({
      command: "NOTICE",
      params: ["nick", "\u0001Hello world\u0001"],
    } as Raw),
    true,
  );
});

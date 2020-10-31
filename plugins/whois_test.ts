import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { whois } from "./whois.ts";

Deno.test("whois commands", async () => {
  const { server, client, sanitize } = arrange([whois], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.whois("nick");
  const raw1 = await server.once("WHOIS");
  assertEquals(raw1, "WHOIS nick");

  client.whois("serverhost", "nick");
  const raw2 = await server.once("WHOIS");
  assertEquals(raw2, "WHOIS serverhost nick");

  await sanitize();
});

Deno.test("whois events", async () => {
  const { server, client, sanitize } = arrange([whois], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":serverhost 311 nick nick2 username userhost * :real name");
  server.send(":serverhost 319 nick nick2 :@#test1 #test2");
  server.send(":serverhost 312 nick nick2 serverhost :IRC Server");
  server.send(":serverhost 317 nick nick2 123 :seconds idle");
  server.send(":serverhost 313 nick nick2 :is an IRC operator");
  server.send(":serverhost 301 nick nick2 :is away");
  server.send(":serverhost 318 nick nick2 :End of /WHOIS list.");

  const msg = await client.once("whois_reply");
  assertEquals(msg, {
    nick: "nick2",
    host: "userhost",
    username: "username",
    realname: "real name",
    channels: ["@#test1", "#test2"],
    server: "serverhost",
    serverInfo: "IRC Server",
    idle: 123,
    operator: "is an IRC operator",
    away: "is away",
  });

  await sanitize();
});

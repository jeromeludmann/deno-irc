import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { plugin as motd } from "./motd.ts";

Deno.test("motd commands", async () => {
  const { server, client, sanitize } = arrange([motd], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.motd();
  const raw = await server.once("MOTD");
  assertEquals(raw, "MOTD");

  await sanitize();
});

Deno.test("motd events", async () => {
  const { server, client, sanitize } = arrange([motd], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":serverhost 422 nick :MOTD File is missing");
  const msg1 = await client.once("motd");
  assertEquals(msg1, { motd: undefined });

  server.send(":serverhost 375 nick :- serverhost Message of the day - ");
  server.send(":serverhost 372 nick :- Welcome to the");
  server.send(":serverhost 372 nick :- fake server!");
  server.send(":serverhost 376 nick :End of MOTD command");
  const msg2 = await client.once("motd");
  assertEquals(msg2, {
    motd: [
      "- Welcome to the",
      "- fake server!",
    ],
  });

  await sanitize();
});

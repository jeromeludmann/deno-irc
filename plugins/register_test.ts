import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { register } from "./register.ts";

Deno.test("register events", async () => {
  const { server, client, sanitize } = arrange([register], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":serverhost 001 nick :Welcome to the server");
  const msg1 = await client.once("register");
  assertEquals(msg1, {
    nick: "nick",
    text: "Welcome to the server",
  });

  await sanitize();
});

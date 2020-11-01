import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { register } from "./register.ts";

Deno.test("register commands", async () => {
  const { server, client, sanitize } = arrange([register], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.user("username", "real name");
  const raw1 = await server.once("USER");
  assertEquals(raw1, "USER username 0 * :real name");

  client.pass("password");
  const raw2 = await server.once("PASS");
  assertEquals(raw2, "PASS password");

  await sanitize();
});

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

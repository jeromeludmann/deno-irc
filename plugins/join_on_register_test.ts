import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { join } from "./join.ts";
import { joinOnRegister } from "./join_on_register.ts";
import { register } from "./register.ts";

Deno.test("join_on_register", async () => {
  const { server, client, sanitize } = arrange(
    [joinOnRegister, join, register],
    { channels: ["#channel1", "#channel2"] },
  );

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":serverhost 001 nick :Welcome to the server");
  const raw = await server.once("JOIN");
  assertEquals(raw, "JOIN #channel1,#channel2");

  await sanitize();
});

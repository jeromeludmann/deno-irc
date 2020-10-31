import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { plugin as oper } from "./oper.ts";
import { plugin as operOnRegister } from "./oper_on_register.ts";
import { plugin as register } from "./register.ts";

Deno.test("oper_on_register", async () => {
  const { server, client, sanitize } = arrange(
    [operOnRegister, oper, register],
    { oper: { user: "user", pass: "pass" } },
  );

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":serverhost 001 nick :Welcome to the server");
  const raw = await server.once("OPER");
  assertEquals(raw, "OPER user pass");

  await sanitize();
});

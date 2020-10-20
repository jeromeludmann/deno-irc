import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { plugin as oper } from "./oper.ts";

Deno.test("oper commands", async () => {
  const { server, client, sanitize } = arrange([oper], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.oper("user", "pass");
  const raw = await server.once("OPER");
  assertEquals(raw, "OPER user pass");

  await sanitize();
});

import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { serverError } from "./server_error.ts";

Deno.test("server_error events", async () => {
  const { server, client, sanitize } = arrange([serverError], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send("ERROR :Closing link: (user@host) [Client exited]");
  const err = await client.once("error");
  assertEquals(err.name, "ServerError");
  assertEquals(err.message, "Closing link: (user@host) [Client exited]");

  await sanitize();
});

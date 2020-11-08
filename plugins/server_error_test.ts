import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { serverError } from "./server_error.ts";

Deno.test("server_error events", async () => {
  const { server, client, sanitize } = arrange([serverError], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  // "ERROR"
  server.send("ERROR :Closing link: (user@host) [Client exited]");
  const err1 = await client.once("error:server");
  assertEquals(err1.command, "ERROR");
  assertEquals(err1.params, ["Closing link: (user@host) [Client exited]"]);
  assertEquals(err1.name, "ServerError");
  assertEquals(
    err1.message,
    "ERROR: Closing link: (user@host) [Client exited]",
  );

  // "ERR_"
  server.send(":serverhost 433 nick nick2 :Nickname is already in use");
  const err2 = await client.once("error:server");
  assertEquals(err2.command, "ERR_NICKNAMEINUSE");
  assertEquals(err2.params, ["nick", "nick2", "Nickname is already in use"]);
  assertEquals(err2.name, "ServerError");
  assertEquals(
    err2.message,
    "ERR_NICKNAMEINUSE: nick nick2 Nickname is already in use",
  );

  await sanitize();
});

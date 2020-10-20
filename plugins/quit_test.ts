import { assertEquals } from "../core/test_deps.ts";
import { arrange } from "../core/test_helpers.ts";
import { plugin as error } from "./error.ts";
import { plugin as quit } from "./quit.ts";

Deno.test("quit commands", async () => {
  const { server, client, sanitize } = arrange([error, quit], {});

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.quit();
  const raw1 = await server.once("QUIT");
  assertEquals(raw1, "QUIT");

  client.quit("Goodbye!");
  const raw2 = await server.once("QUIT");
  assertEquals(raw2, "QUIT Goodbye!");

  // "quit" command should never throw a server error
  client.quit();
  await server.once("QUIT");
  server.send("ERROR :Closing link: (user@host) [Client exited]");
  const msg = await client.once("raw");
  assertEquals(msg, {
    command: "ERROR",
    params: ["Closing link: (user@host) [Client exited]"],
    prefix: "",
    raw: "ERROR :Closing link: (user@host) [Client exited]",
  });

  await sanitize();
});

Deno.test("quit events", async () => {
  const { server, client, sanitize } = arrange([quit], {});

  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();

  server.send(":nick!user@host QUIT");
  const msg1 = await client.once("quit");
  assertEquals(msg1, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    comment: undefined,
  });

  server.send(":nick!user@host QUIT :Goodbye!");
  const msg2 = await client.once("quit");
  assertEquals(msg2, {
    origin: { nick: "nick", username: "user", userhost: "host" },
    comment: "Goodbye!",
  });

  await sanitize();
});

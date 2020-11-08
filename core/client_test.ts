import { assertEquals, assertExists, assertMatch } from "./test_deps.ts";
import { arrange } from "./test_helpers.ts";

Deno.test("core client connect", async () => {
  const { server, client, sanitize } = arrange([], {});

  server.listen();

  client.connect("unreachable");
  const err = await client.once("error:client");
  assertEquals(err.name, "ClientError");
  assertMatch(err.message, /^connect: .+$/);
  assertEquals(err.op, "connect");
  assertExists(err.cause);

  client.connect(server.host, server.port);
  const connected = await client.once("connected");
  assertEquals(connected, {
    hostname: server.host,
    port: server.port,
  });

  await sanitize();
});

Deno.test("core client disconnect", async () => {
  const { server, client, sanitize } = arrange([], {});

  // closed by server
  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();
  server.close();
  const msg1 = await client.once("disconnected");
  assertEquals(msg1, {
    hostname: server.host,
    port: server.port,
  });

  // closed by client
  server.listen();
  client.connect(server.host, server.port);
  await server.waitClient();
  client.disconnect();
  const msg2 = await client.once("disconnected");
  assertEquals(msg2, {
    hostname: server.host,
    port: server.port,
  });

  await sanitize();
});

Deno.test("core client send", async () => {
  const { server, client, sanitize } = arrange([], {});

  const [err] = await Promise.all([
    client.once("error:client"),
    client.send("PING", "key"),
  ]);
  assertEquals(err.name, "ClientError");
  assertEquals(err.message, "write: Not connected");
  assertEquals(err.op, "write");
  assertEquals(err.cause, undefined);

  server.listen();
  client.connect(server.host, server.port);
  await client.once("connected");

  client.send("PING", "key");
  const raw = await server.once("PING");
  assertEquals(raw, "PING key");

  await sanitize();
});

import { assertEquals, assertRejects, assertThrows } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mockConsole } from "../testing/console.ts";
import { MockServer } from "../testing/server.ts";
import { MockCoreClient } from "../testing/client.ts";
import { type CoreFeatures } from "./client.ts";
import { createPlugin, type Plugin } from "./plugins.ts";

describe("core/client", (test) => {
  const mock = (
    options: CoreFeatures["options"] = {},
    plugins: Plugin[] = [],
  ) => {
    const client = new MockCoreClient(plugins, options);
    const server = new MockServer(client);
    const console = mockConsole();
    return { client, server, console };
  };

  test("initialize core state", () => {
    const { client } = mock();

    assertEquals(client.state, {
      remoteAddr: {
        hostname: "",
        port: 0,
        tls: false,
      },
    });
  });

  test("connect to server", async () => {
    const { client } = mock();

    client.connect("host", 6668);
    const addr = await client.once("connected");

    assertEquals(addr, {
      hostname: "host",
      port: 6668,
      tls: false,
    });
  });

  test("fail to connect", async () => {
    const { client } = mock();

    client.connect("bad_remote_host");
    const error = await client.once("error");

    assertEquals(error.name, "Error");
    assertEquals(error.type, "connect");
  });

  test("throw on connect", () => {
    const { client } = mock();

    assertRejects(
      () => client.connect("bad_remote_host"),
      Error,
      "Connection refused",
    );
  });

  test("send raw message to server", async () => {
    const { client, server } = mock();

    await client.connect("host");

    client.send("PING", "key");
    client.send("JOIN", "#channel", undefined);
    const raw = server.receive();

    assertEquals(raw, [
      "PING key",
      "JOIN #channel",
    ]);
  });

  test("fail to send raw message if not connected", async () => {
    const { client } = mock();

    const [error] = await Promise.all([
      client.once("error"),
      client.send("PING", "key"),
    ]);

    assertEquals(error.name, "Error");
    assertEquals(error.type, "write");
  });

  test("throw on send", () => {
    const { client } = mock();

    assertRejects(
      () => client.send("PING", "key"),
      Error,
      "Unable to send message",
    );
  });

  test("receive raw messages from server", async () => {
    const { client, server } = mock();
    const messages = [];

    await client.connect("host");

    server.send("PING key");
    messages.push(await client.once("raw"));

    server.send(":serverhost 001 me :Welcome to the server");
    messages.push(await client.once("raw"));

    assertEquals(messages, [
      {
        command: "PING",
        params: ["key"],
      },
      {
        source: { name: "serverhost" },
        command: "001",
        params: ["me", "Welcome to the server"],
      },
    ]);
  });

  test("disconnect from server", async () => {
    const { client } = mock();

    await client.connect("host");
    const [addr] = await Promise.all([
      client.once("disconnected"),
      client.disconnect(),
    ]);

    assertEquals(addr, {
      hostname: "host",
      port: 6667,
      tls: false,
    });
  });

  test("be disconnected by server", async () => {
    const { client, server } = mock();

    await client.connect("host");
    server.shutdown();
    const msg = await client.once("disconnected");

    assertEquals(msg, {
      hostname: "host",
      port: 6667,
      tls: false,
    });
  });

  test("not disconnect if not connected", async () => {
    const { client } = mock();

    client.disconnect();
    const addr = await client.wait("disconnected", 1);

    assertEquals(addr, null);
  });

  const plugins = [
    createPlugin("test_error")((client) => {
      client.on("connected", () => {
        throw new Error("Boom!");
      });
    }),
    createPlugin("test_catch")((client) => {
      client.on("error", () => {});
    }),
  ];

  test("throw if no listeners bound to 'error'", () => {
    const { client } = mock({}, plugins);

    assertRejects(
      () => client.connect(""),
      Error,
      "Boom!",
    );
  });

  test("not throw if listeners bound to 'error'", async () => {
    const { client } = mock({}, plugins);

    client.connect("");
    const error = await client.once("error");

    assertEquals(error.name, "Error");
    assertEquals(error.type, "connect");
  });

  test("throw if too many registered listeners", () => {
    const { client } = mock();
    const noop = () => {};

    const subscribeForever = () => {
      for (;;) client.on("raw", noop);
    };

    assertThrows(
      subscribeForever,
      Error,
      'Too many listeners for "raw" event',
    );
  });
});

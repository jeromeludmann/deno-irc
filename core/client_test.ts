import { assertEquals, assertRejects, assertThrows } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mockConsole } from "../testing/console.ts";
import { MockServer } from "../testing/server.ts";
import { MockCoreClient } from "../testing/client.ts";
import { type CoreFeatures } from "./client.ts";
import { type Raw } from "./parsers.ts";
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

  test("connect to server with TLS", async () => {
    const { client } = mock();

    client.connect("host", 6668, true);
    const addr = await client.once("connected");

    assertEquals(addr, {
      hostname: "host",
      port: 6668,
      tls: true,
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

  test("throw on send if missing connection", () => {
    const { client } = mock();

    assertRejects(
      () => client.send("PING", "key"),
      Error,
      "Unable to send message",
    );
  });

  test("throw on send if error is thrown", async () => {
    const { client } = mock();

    await client.connect("host");

    client.conn!.write = () => {
      throw new Error("Error while writing");
    };

    assertRejects(
      () => client.send("PING", "key"),
      Error,
      "Error while writing",
    );
  });

  test("receive raw messages from server", async () => {
    const { client, server } = mock();
    const messages = [];

    await client.connect("host");

    server.send("PING key");
    messages.push(await client.once("raw:ping"));

    server.send(":serverhost 001 me :Welcome to the server");
    messages.push(await client.once("raw:rpl_welcome"));

    assertEquals(messages, [
      {
        command: "ping",
        params: ["key"],
      },
      {
        source: { name: "serverhost" },
        command: "rpl_welcome",
        params: ["me", "Welcome to the server"],
      },
    ]);
  });

  test("fail to receive raw messages from server if error is thrown", async () => {
    const { client, server } = mock();

    await client.connect("host");

    client.conn!.read = () => {
      throw new Error("Error while reading");
    };

    server.send("won't be sent because of reading error");
    const error = await client.once("error");

    assertEquals(error.name, "Error");
    assertEquals(error.type, "read");
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

  test("throw on disconnect if error is thrown", async () => {
    const { client } = mock();

    await client.connect("host");

    client.conn!.close = () => {
      throw new Error("Error while closing");
    };

    assertThrows(
      () => client.disconnect(),
      Error,
      "Error while closing",
    );
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
      for (;;) client.on("connected", noop);
    };

    assertThrows(
      subscribeForever,
      Error,
      'Too many listeners for "connected" event',
    );
  });

  test("subscribe to 'raw' multi event", async () => {
    const { client, server } = mock();
    const messages: Raw[] = [];

    await client.connect("host");

    client.on("raw", (msg) => messages.push(msg));
    client.on(["raw"], (msg) => messages.push(msg));

    server.send([
      "PING key",
      ":serverhost 001 me :Welcome to the server",
      ":someone!user@host JOIN #channel",
      ":someone!user@host NICK me",
    ]);

    await client.once("raw:nick");

    // should have:
    // - 4 messages for `client.on("raw", fn)`
    // - 4 messages for `client.on(["raw"], fn)`
    assertEquals(messages.length, 8);
  });

  test("swallow some Deno errors silently", () => {
    const { client } = mock();
    let triggered = 0;

    client.on("error", () => {
      triggered++;
    });

    client.emitError("write", new Error("Boom!")); // +1
    client.emitError("write", new Deno.errors.BadResource()); // should not throw
    client.emitError("write", new Deno.errors.Interrupted()); // should not throw

    assertEquals(triggered, 1);
  });
});

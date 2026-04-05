import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mockConsole } from "../testing/console.ts";
import { MockServer } from "../testing/server.ts";
import { MockCoreClient, SilentTestError } from "../testing/client.ts";
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

    client.connect("host", { port: 6668 });
    const addr = await client.once("connected");

    assertEquals(addr, {
      hostname: "host",
      port: 6668,
      tls: false,
    });
  });

  test("connect to server with TLS", async () => {
    const { client } = mock();

    client.connect("host", { port: 6668, tls: true });
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

  test("send raw message with tags", async () => {
    const { client, server } = mock();

    await client.connect("host");

    client.send({ "+typing": "active" }, "TAGMSG", "#channel");
    const raw = server.receive();

    assertEquals(raw, ["@+typing=active TAGMSG #channel"]);
  });

  test("send raw message with tags and value escaping", async () => {
    const { client, server } = mock();

    await client.connect("host");

    client.send({ "+msg": "hello world" }, "TAGMSG", "#channel");
    const raw = server.receive();

    assertEquals(raw, ["@+msg=hello\\sworld TAGMSG #channel"]);
  });

  test("send raw message with tag without value", async () => {
    const { client, server } = mock();

    await client.connect("host");

    client.send({ "+typing": undefined }, "TAGMSG", "#channel");
    const raw = server.receive();

    assertEquals(raw, ["@+typing TAGMSG #channel"]);
  });

  test("send raw message with multiple tags", async () => {
    const { client, server } = mock();

    await client.connect("host");

    client.send(
      { "+reply": "msgid123", "+typing": "active" },
      "PRIVMSG",
      "#channel",
      "hello",
    );
    const raw = server.receive();

    assertEquals(raw.length, 1);
    assertEquals(raw[0].startsWith("@"), true);
    assertEquals(raw[0].includes("+reply=msgid123"), true);
    assertEquals(raw[0].includes("+typing=active"), true);
    assertEquals(raw[0].includes("PRIVMSG #channel hello"), true);
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

  test("not disconnect if not connected", () => {
    const { client } = mock();

    let disconnected = false;
    client.on("disconnected", () => disconnected = true);
    client.disconnect();

    assertEquals(disconnected, false);
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

    const subscribeForever = () => {
      for (;;) client.on("connected", () => {});
    };

    assertThrows(
      subscribeForever,
      Error,
      "Too many listeners for 'connected' event",
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

  test("not expose cert/key in connecting event", async () => {
    const { client } = mock();

    const connectingPromise = client.once("connecting");
    client.connect("host", {
      port: 6668,
      tls: true,
      cert: "SECRET_CERT",
      key: "SECRET_KEY",
    });
    const addr = await connectingPromise;

    assertEquals(addr.hostname, "host");
    assertEquals(addr.tls, true);
    assertEquals("cert" in addr, false);
    assertEquals("key" in addr, false);
    client.disconnect();
  });

  test("not expose cert/key in connected event", async () => {
    const { client } = mock();

    const connectedPromise = client.once("connected");
    client.connect("host", {
      port: 6668,
      tls: true,
      cert: "SECRET_CERT",
      key: "SECRET_KEY",
    });
    const addr = await connectedPromise;

    assertEquals(addr.hostname, "host");
    assertEquals(addr.tls, true);
    assertEquals("cert" in addr, false);
    assertEquals("key" in addr, false);
    client.disconnect();
  });

  test("not expose cert/key in disconnected event", async () => {
    const { client } = mock();

    await client.connect("host", {
      port: 6668,
      tls: true,
      cert: "SECRET_CERT",
      key: "SECRET_KEY",
    });
    const [addr] = await Promise.all([
      client.once("disconnected"),
      client.disconnect(),
    ]);

    assertEquals(addr.hostname, "host");
    assertEquals(addr.tls, true);
    assertEquals("cert" in addr, false);
    assertEquals("key" in addr, false);
  });

  test("store TLS cert and key in remoteAddr", async () => {
    const { client } = mock();

    await client.connect("host", {
      tls: true,
      cert: "INLINE_CERT",
      key: "INLINE_KEY",
    });

    assertEquals(client.state.remoteAddr.cert, "INLINE_CERT");
    assertEquals(client.state.remoteAddr.key, "INLINE_KEY");
    client.disconnect();
  });

  test("swallow silent errors", () => {
    const { client } = mock();
    let triggered = 0;

    client.on("error", () => {
      triggered++;
    });

    client.emitError("write", new Error("Boom!")); // +1
    client.emitError("write", new SilentTestError()); // should not throw
    client.emitError("write", new SilentTestError()); // should not throw

    assertEquals(triggered, 1);
  });

  test("survive unknown commands from server", async () => {
    const { client, server } = mock();
    await client.connect("host");

    server.send([
      "FOOBAR",
      "BAZQUX param1 param2",
      "123 me :unknown numeric",
      "PING :alive",
    ]);

    const msg = await client.once("raw:ping");
    assertEquals(msg.params, ["alive"]);
    server.shutdown();
    await client.once("disconnected");
  });

  test("survive empty lines from server", async () => {
    const { client, server } = mock();
    await client.connect("host");

    server.send([
      "",
      "   ",
      "PING :ok",
    ]);

    const msg = await client.once("raw:ping");
    assertEquals(msg.params, ["ok"]);
    server.shutdown();
    await client.once("disconnected");
  });

  test("survive malformed prefix from server", async () => {
    const { client, server } = mock();
    await client.connect("host");

    server.send([
      ":!@ PRIVMSG #ch :hello",
      ":@! PRIVMSG #ch :hello",
      ": PRIVMSG #ch :hello",
      "PING :ok",
    ]);

    const msg = await client.once("raw:ping");
    assertEquals(msg.params, ["ok"]);
    server.shutdown();
    await client.once("disconnected");
  });

  test("survive malformed tags from server", async () => {
    const { client, server } = mock();
    await client.connect("host");

    server.send([
      "@ PING :1",
      "@=== PING :2",
      "@;; PING :3",
      "@key PING :4",
      "PING :ok",
    ]);

    const msg = await client.once("raw:ping");
    assertEquals(msg.command, "ping");
    server.shutdown();
    await client.once("disconnected");
  });

  test("survive server shutdown mid-conversation", async () => {
    const { client, server } = mock();
    await client.connect("host");

    server.send("PING :before");
    await client.once("raw:ping");

    server.shutdown();
    await client.once("disconnected");
  });

  test("survive null bytes in messages", async () => {
    const { client, server } = mock();
    await client.connect("host");

    server.send(":nick!u@h PRIVMSG #ch :\x00null\x00bytes");
    const msg = await client.once("raw:privmsg");
    assertEquals(msg.params[1], "\x00null\x00bytes");
    server.shutdown();
    await client.once("disconnected");
  });

  test("survive very long message from server", async () => {
    const { client, server } = mock({ bufferSize: 65536 });
    await client.connect("host");

    const longText = "A".repeat(10_000);
    server.send(`:nick!u@h PRIVMSG #ch :${longText}`);
    const msg = await client.once("raw:privmsg");
    assertEquals(msg.params[1].length, 10_000);
    server.shutdown();
    await client.once("disconnected");
  });

  test("survive flood of messages", async () => {
    const { client, server } = mock();
    await client.connect("host");

    const N = 80;
    let count = 0;
    const done = new Promise<void>((resolve) => {
      const off = client.on("raw:privmsg", () => {
        if (++count === N) {
          off();
          resolve();
        }
      });
    });

    server.send(
      Array.from({ length: N }, (_, i) => `:nick!u@h PRIVMSG #ch :msg${i}`),
    );
    await done;
    assertEquals(count, N);
    server.shutdown();
    await client.once("disconnected");
  });
});

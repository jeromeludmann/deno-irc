import { assertEquals, assertThrows, assertThrowsAsync } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { FatalError, Plugin } from "./client.ts";

describe("core/client", (test) => {
  test("connect to server", async () => {
    const { client } = await mock([], {}, { withConnection: false });

    client.connect("host", 6668);
    const addr = await client.once("connected");

    assertEquals(addr, {
      hostname: "host",
      port: 6668,
    });
  });

  test("fail to connect", async () => {
    const { client } = await mock([], {}, { withConnection: false });

    client.connect("bad_remote_host");
    const error = await client.once("error");

    assertEquals(error.name, "FatalError");
    assertEquals(error.type, "connect");
  });

  test("throw on connect", async () => {
    const { client } = await mock([], {}, { withConnection: false });

    assertThrowsAsync(
      () => client.connect("bad_remote_host"),
      FatalError,
      "connect",
    );
  });

  test("send raw message to server", async () => {
    const { client, server } = await mock([], {});

    client.send("PING", "key");
    const raw = server.receive();

    assertEquals(raw, ["PING key"]);
  });

  test("fail to send raw message if not connected", async () => {
    const { client } = await mock([], {}, { withConnection: false });

    const [error] = await Promise.all([
      client.once("error"),
      client.send("PING", "key"),
    ]);

    assertEquals(error.name, "FatalError");
    assertEquals(error.type, "write");
  });

  test("throw on send", async () => {
    const { client } = await mock([], {}, { withConnection: false });

    assertThrowsAsync(
      () => client.send("PING", "key"),
      FatalError,
      "write",
    );
  });

  test("receive raw messages from server", async () => {
    const { client, server } = await mock([], {});
    const messages = [];

    server.send("PING key");
    messages.push(await client.once("raw"));

    server.send(":serverhost 001 me :Welcome to the server");
    messages.push(await client.once("raw"));

    assertEquals(messages, [
      {
        command: "PING",
        params: ["key"],
        prefix: "",
      },
      {
        command: "RPL_WELCOME",
        params: ["me", "Welcome to the server"],
        prefix: "serverhost",
      },
    ]);
  });

  test("disconnect from server", async () => {
    const { client } = await mock([], {}, { withConnection: false });

    await client.connect("host");
    const [addr] = await Promise.all([
      client.once("disconnected"),
      client.disconnect(),
    ]);

    assertEquals(addr, {
      hostname: "host",
      port: 6667,
    });
  });

  test("be disconnected by server", async () => {
    const { client, server } = await mock([], {}, { withConnection: false });

    await client.connect("host");
    server.shutdown();
    const msg = await client.once("disconnected");

    assertEquals(msg, {
      hostname: "host",
      port: 6667,
    });
  });

  test("not disconnect if not connected", async () => {
    const { client } = await mock([], {}, { withConnection: false });

    client.disconnect();
    const addr = await client.wait("disconnected", 1);

    assertEquals(addr, null);
  });

  const throwOnConnect: Plugin = (client) => {
    client.on("connected", () => {
      throw new Error("Boom!");
    });
  };

  const catchErrors: Plugin = (client) => {
    client.on("error", () => {});
  };

  const plugins = [throwOnConnect, catchErrors];

  test("throw if no listeners bound to 'error'", async () => {
    const { client } = await mock(plugins, {}, { withConnection: false });

    assertThrowsAsync(
      () => client.connect(""),
      FatalError,
      "Boom!",
    );
  });

  test("not throw if listeners bound to 'error'", async () => {
    const { client } = await mock(plugins, {}, { withConnection: false });

    client.connect("");
    const error = await client.once("error");

    assertEquals(error.name, "FatalError");
    assertEquals(error.type, "connect");
  });

  test("throw if too many registered listeners", async () => {
    const { client } = await mock([], {});
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

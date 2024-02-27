import { assertEquals, assertRejects } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/reconnect", (test) => {
  const noop = () => {};

  test("reconnect on connect error", async () => {
    const { client } = await mock(
      { reconnect: { attempts: 2, delay: 0 } },
      { withConnection: false },
    );

    let reconnecting = 0;
    client.on("reconnecting", () => reconnecting++);
    client.on("error", noop);

    client.connect("bad_remote_host", 6667);
    await client.once("reconnecting");

    assertEquals(reconnecting, 1);

    await client.once("error"); // wait for timeout clearing
  });

  test("reconnect on server error", async () => {
    const { client, server } = await mock(
      { reconnect: { attempts: 2, delay: 0 } },
      { withConnection: false },
    );

    let reconnecting = 0;
    client.on("reconnecting", () => reconnecting++);
    client.on("error", noop);

    await client.connect("", 6667);
    server.send("ERROR :Closing link: (user@host) [Client exited]");
    await client.once("reconnecting");

    assertEquals(reconnecting, 1);

    await client.once("connecting"); // wait for timeout clearing
  });

  test("reset attemps when RPL_WELCOME is received", async () => {
    const { client, server } = await mock(
      { reconnect: { attempts: 2, delay: 0 } },
      { withConnection: false },
    );

    let reconnecting = 0;
    client.on("reconnecting", () => reconnecting++);
    client.on("error", noop);

    await client.connect("", 6667);

    // attempt 1
    server.send("ERROR :Closing link: (user@host) [Client exited]");
    await client.once("reconnecting");

    // attempt 2
    server.send("ERROR :Closing link: (user@host) [Client exited]");
    await client.once("reconnecting");

    // resets attemps
    server.send(":serverhost 001 me :Welcome to the server");
    await client.once("raw:rpl_welcome");

    // attempt 1
    server.send("ERROR :Closing link: (user@host) [Client exited]");
    await client.once("reconnecting");

    assertEquals(reconnecting, 3);

    await client.once("connecting"); // wait for timeout clearing
  });

  test("not reconnect if disabled", async () => {
    const { client } = await mock(
      { reconnect: false },
      { withConnection: false },
    );

    let reconnecting = 0;
    client.on("reconnecting", () => reconnecting++);
    client.on("error", noop);

    client.connect("bad_remote_host", 6667);

    assertEquals(reconnecting, 0);
  });

  test("throw if missing error listener", async () => {
    const { client } = await mock(
      { reconnect: true },
      { withConnection: false },
    );

    assertRejects(
      async () => await client.connect("", 6667),
      Error,
      "plugins/reconnect requires an error listener",
    );
  });
});

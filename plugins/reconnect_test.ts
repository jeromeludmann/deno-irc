import { Plugin } from "../core/client.ts";
import { assertEquals, assertThrowsAsync } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { reconnect } from "./reconnect.ts";

describe("plugins/reconnect", (test) => {
  const plugins = [reconnect];
  const noop = () => {};

  test("reconnect on connect error", async () => {
    const { client } = await mock(
      plugins,
      { reconnect: { attempts: 2, delay: 0 } },
      { withConnection: false },
    );

    let reconnecting = 0;
    client.on("reconnecting", () => reconnecting++);
    client.on("error", noop);

    client.connect("bad_remote_host");
    await client.once("reconnecting");

    assertEquals(reconnecting, 1);
  });

  test("reconnect on server error", async () => {
    const { client, server } = await mock(
      plugins,
      { reconnect: { attempts: 2, delay: 0 } },
      { withConnection: false },
    );

    let reconnecting = 0;
    client.on("reconnecting", () => reconnecting++);
    client.on("error", noop);

    await client.connect("");
    server.send("ERROR :Closing link: (user@host) [Client exited]");
    await client.once("reconnecting");

    assertEquals(reconnecting, 1);
  });

  test("not reconnect if disabled", async () => {
    const { client } = await mock(
      plugins,
      { reconnect: false },
      { withConnection: false },
    );

    let reconnecting = 0;
    client.on("reconnecting", () => reconnecting++);
    client.on("error", noop);

    client.connect("bad_remote_host");

    assertEquals(reconnecting, 0);
  });

  test("throw if missing error listener", async () => {
    let error;
    const catchError: Plugin = async (client) =>
      error = await client.once("error");

    const { client } = await mock(
      [...plugins, catchError],
      { reconnect: true },
      { withConnection: false },
    );

    assertThrowsAsync(
      () => client.connect(""),
      Error,
      "plugins/reconnect requires an error listener",
    );
  });
});

import { assertArrayIncludes, assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/verbose", (test) => {
  const options = { verbose: true };

  test("print received raw messages", async () => {
    const { client, server, console } = await mock(options);

    server.send(":someone!user@host JOIN #channel");
    await client.once("join");

    assertArrayIncludes(console.stdout, [
      ["read", "chunks", '":someone!user@host JOIN #channel\\r\\n"'],
    ]);
  });

  test("print sent raw messages", async () => {
    const { client, console } = await mock(options);

    await client.send("JOIN", "#channel");

    assertArrayIncludes(console.stdout, [
      ["send", "raw", '"JOIN #channel\\r\\n"'],
    ]);
  });

  test("print invoked commands", async () => {
    const { client, console } = await mock(options);

    await client.send("JOIN", "#channel");

    assertArrayIncludes(console.stdout, [
      ["send", "JOIN", ["#channel"]],
    ]);
  });

  test("print emitted events", async () => {
    const { client, server, console } = await mock(
      options,
      { withConnection: false },
    );

    client.connect("host");
    await client.once("connected");
    server.send("ERROR :Closing link: (user@host) [Client exited]");
    await client.once("error");

    assertArrayIncludes(console.stdout, [
      ["emit", "connecting", {
        hostname: "host",
        port: 6667,
        tls: false,
      }],
      ["emit", "connected", {
        hostname: "host",
        port: 6667,
        tls: false,
      }],
      ["emit", "error", {
        name: "Error",
        type: "read",
        message: "ERROR: Closing link: (user@host) [Client exited]",
      }],
    ]);
  });

  test("print state changes", async () => {
    const { client, server, console } = await mock(
      { ...options, nick: "current_nick" },
    );

    server.send(":current_nick!user@host NICK new_nick");
    await client.once("nick");

    assertArrayIncludes(console.stdout, [
      ["diff", "nick", '- "current_nick"'],
      ["diff", "nick", '+ "new_nick"'],
    ]);
  });

  test("print nothing if disabled", async () => {
    const { client, server, console } = await mock(
      { verbose: false, nick: "me" },
      { withConnection: false },
    );

    client.connect("");
    await client.once("connected");
    client.send("JOIN", "#channel");
    server.send(":me!user@host JOIN #channel");
    await client.once("join");

    assertEquals(console.stdout, []);
  });
});

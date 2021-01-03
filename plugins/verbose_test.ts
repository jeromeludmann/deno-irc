import { assertArrayIncludes, assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { nick } from "./nick.ts";
import { register } from "./register.ts";
import { registerOnConnect } from "./register_on_connect.ts";
import { throwOnError } from "./throw_on_error.ts";
import { verbose } from "./verbose.ts";

describe("plugins/verbose", (test) => {
  const plugins = [verbose];
  const options = { verbose: true };

  test("print received raw messages", async () => {
    const { client, server, console } = await mock(plugins, options);

    server.send(":someone!user@host JOIN #channel");
    await client.once("raw");

    assertArrayIncludes(console.stdout, [
      ["read", "chunks", '":someone!user@host JOIN #channel\\r\\n"'],
    ]);
  });

  test("print sent raw messages", async () => {
    const { client, console } = await mock(plugins, options);

    await client.send("JOIN", "#channel");

    assertArrayIncludes(console.stdout, [
      ["send", "raw", '"JOIN #channel\\r\\n"'],
    ]);
  });

  test("print invoked commands", async () => {
    const { client, console } = await mock(plugins, options);

    await client.send("JOIN", "#channel");

    assertArrayIncludes(console.stdout, [
      ["send", "JOIN", ["#channel"]],
    ]);
  });

  test("print emitted events", async () => {
    const { client, server, console } = await mock(
      [...plugins, throwOnError],
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
      }],
      ["emit", "connected", {
        hostname: "host",
        port: 6667,
      }],
      ["emit", "error", {
        name: "FatalError",
        type: "read",
        message: "read: Closing link: (user@host) [Client exited]",
      }],
    ]);
  });

  test("print state changes", async () => {
    const { client, server, console } = await mock(
      [...plugins, nick, register, registerOnConnect],
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
      [...plugins, nick, register, registerOnConnect],
      { verbose: false, nick: "me" },
      { withConnection: false },
    );

    client.connect("");
    await client.once("connected");
    client.send("JOIN", "#channel");
    server.send(":me!user@host JOIN #channel");
    await client.once("raw");

    assertEquals(console.stdout, []);
  });
});

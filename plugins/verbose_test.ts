import { assertArrayIncludes, assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { nickPlugin } from "./nick.ts";
import { registerPlugin } from "./register.ts";
import { registrationPlugin } from "./registration.ts";
import { throwOnErrorPlugin } from "./throw_on_error.ts";
import { verbosePlugin } from "./verbose.ts";

describe("plugins/verbose", (test) => {
  const plugins = [verbosePlugin];
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
      [...plugins, throwOnErrorPlugin],
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
      [...plugins, nickPlugin, registerPlugin, registrationPlugin],
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
      [...plugins, nickPlugin, registerPlugin, registrationPlugin],
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

import { assertArrayIncludes, assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { nick } from "./nick.ts";
import { register } from "./register.ts";
import { registerOnConnect } from "./register_on_connect.ts";
import { serverError } from "./server_error.ts";
import { userState } from "./user_state.ts";
import { verbose } from "./verbose.ts";

describe("plugins/verbose", (test) => {
  const plugins = [verbose];
  const options = { verbose: true };

  test("print received raw messages", async () => {
    const { client, server, console } = await mock(plugins, options);

    server.send(":someone!user@host JOIN #channel");
    await client.once("raw");

    assertArrayIncludes(console.stdout, [
      ["< :someone!user@host JOIN #channel"],
    ]);
  });

  test("print sent raw messages", async () => {
    const { client, console } = await mock(plugins, options);

    await client.send("JOIN", "#channel");

    assertArrayIncludes(console.stdout, [
      ["> JOIN #channel"],
    ]);
  });

  test("print invoked commands", async () => {
    const { client, console } = await mock(plugins, options);

    await client.send("JOIN", "#channel");

    assertArrayIncludes(console.stdout, [
      ["JOIN", ["#channel"]],
    ]);
  });

  test("print emitted events", async () => {
    const { client, server, console } = await mock(
      [...plugins, serverError],
      options,
      { withConnection: false },
    );

    client.connect("host");
    await client.once("connected");
    server.send("ERROR :Closing link: (user@host) [Client exited]");
    await client.once("error");

    assertArrayIncludes(console.stdout, [
      ["connecting", { hostname: "host", port: 6667 }],
      ["connected", { hostname: "host", port: 6667 }],
      ["error", {
        name: "FatalError",
        type: "plugin",
        message: "plugin: Closing link: (user@host) [Client exited]",
      }],
    ]);
  });

  test("print state changes", async () => {
    const { client, server, console } = await mock(
      [...plugins, userState, nick, register, registerOnConnect],
      { ...options, nick: "current_nick" },
    );

    server.send(":current_nick!user@host NICK new_nick");
    await client.once("nick");

    assertArrayIncludes(console.stdout, [
      ['- nick "current_nick"'],
      ['+ nick "new_nick"'],
    ]);
  });

  test("print nothing if disabled", async () => {
    const { client, server, console } = await mock(
      [...plugins, userState, nick, register, registerOnConnect],
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

import { assertArrayIncludes, assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/verbose", (test) => {
  test("print received raw messages", async () => {
    const { client, server, console } = await mock({ verbose: "raw" });

    server.send(":someone!user@host JOIN #channel");
    await client.once("join");

    assertArrayIncludes(console.stdout, [
      ["read", "chunks", '":someone!user@host JOIN #channel\\r\\n"'],
    ]);
  });

  test("print sent raw messages", async () => {
    const { client, console } = await mock({ verbose: "raw" });

    await client.send("JOIN", "#channel");

    assertArrayIncludes(console.stdout, [
      ["send", "raw", '"JOIN #channel\\r\\n"'],
    ]);
  });

  test("print invoked commands", async () => {
    const { client, console } = await mock({ verbose: "formatted" });

    await client.send("JOIN", "#channel");

    assertArrayIncludes(console.stdout, [
      ["send", "JOIN", ["#channel"]],
    ]);
  });

  test("print emitted events", async () => {
    const { client, server, console } = await mock(
      { verbose: "formatted" },
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
    const { client, server, console } = await mock({
      verbose: "formatted",
      nick: "current_nick",
    });

    server.send(":current_nick!user@host NICK new_nick");
    await client.once("nick");

    assertArrayIncludes(console.stdout, [
      ["diff", "nick", '- "current_nick"'],
      ["diff", "nick", '+ "new_nick"'],
    ]);
  });

  test("print nothing if disabled", async () => {
    const { client, server, console } = await mock(
      { verbose: undefined, nick: "me" },
      { withConnection: false },
    );

    client.connect("");
    await client.once("connected");
    client.send("JOIN", "#channel");
    server.send(":me!user@host JOIN #channel");
    await client.once("join");

    assertEquals(console.stdout, []);
  });

  test("use a custom logger implementation", async () => {
    const { client, server, console: mockConsole } = await mock({
      verbose: (payload) => {
        switch (payload.type) {
          case "raw_input":
            console.info("[input]", payload.msg);
            break;
          case "raw_output":
            console.info("[output]", payload.msg);
            break;
          case "command":
            console.info("[command]", payload.command, payload.params);
            break;
          case "event":
            console.info("[event]", payload.event);
            break;
          case "state":
            console.info("[state]", payload.key);
            break;
        }
      },
    });

    server.send(":someone!user@host JOIN #channel");
    await client.once("join");

    await client.send("JOIN", "#channel");

    assertArrayIncludes(mockConsole.stdout, [
      ["[input]", ":someone!user@host JOIN #channel\r\n"],
      ["[command]", "JOIN", ["#channel"]],
      ["[output]", "JOIN #channel\r\n"],
      ["[event]", "nicklist"],
      ["[state]", "remoteAddr"],
    ]);
  });
});

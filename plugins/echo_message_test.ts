import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/echo_message", (test) => {
  test("push 'echo-message' capability", async () => {
    const { client } = await mock();

    assertEquals(
      client.state.caps.requested.includes("echo-message"),
      true,
    );
  });

  test("emit 'echo:privmsg' for self-sent PRIVMSG", async () => {
    const { client, server } = await mock({ nick: "me" });

    server.send(":me!user@host PRIVMSG #channel :hello");
    const msg = await client.once("echo:privmsg");

    assertEquals(msg, {
      source: { name: "me", mask: { user: "user", host: "host" } },
      params: { target: "#channel", text: "hello" },
    });
  });

  test("emit 'echo:notice' for self-sent NOTICE", async () => {
    const { client, server } = await mock({ nick: "me" });

    server.send(":me!user@host NOTICE #channel :hello");
    const msg = await client.once("echo:notice");

    assertEquals(msg, {
      source: { name: "me", mask: { user: "user", host: "host" } },
      params: { target: "#channel", text: "hello" },
    });
  });

  test("do not emit 'echo:privmsg' for other users", async () => {
    const { client, server } = await mock({ nick: "me" });

    let echoed = false;
    client.on("echo:privmsg", () => {
      echoed = true;
    });

    server.send(":other!user@host PRIVMSG #channel :hello");
    await client.once("privmsg");

    assertEquals(echoed, false);
  });

  test("do not emit normal 'privmsg' for self-sent messages", async () => {
    const { client, server } = await mock({ nick: "me" });

    let emitted = false;
    client.on("privmsg", () => {
      emitted = true;
    });

    server.send(":me!user@host PRIVMSG #channel :hello");
    await client.once("echo:privmsg");

    assertEquals(emitted, false);
  });
});

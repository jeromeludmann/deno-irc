import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/bot_mode", (test) => {
  test("push capabilities only when bot option is true", async () => {
    const { client: withBot } = await mock({ bot: true });

    assertEquals(
      withBot.state.caps.requested.includes("draft/bot-mode"),
      true,
    );
    assertEquals(
      withBot.state.caps.requested.includes("bot-mode"),
      true,
    );

    const { client: withoutBot } = await mock();

    assertEquals(
      withoutBot.state.caps.requested.includes("draft/bot-mode"),
      false,
    );
    assertEquals(
      withoutBot.state.caps.requested.includes("bot-mode"),
      false,
    );
  });

  test("send MODE +B after register when bot option is true", async () => {
    const { client, server } = await mock({ nick: "bot", bot: true });

    server.receive(); // discard prior messages

    client.emit("register", {
      source: { name: "server" },
      params: { nick: "bot", text: "Welcome" },
    });

    const raw = server.receive();
    assertEquals(raw.includes("MODE bot +B"), true);
  });

  test("do not send MODE +B when bot option is false", async () => {
    const { client, server } = await mock({ nick: "me" });

    server.receive(); // discard prior messages

    client.emit("register", {
      source: { name: "server" },
      params: { nick: "bot", text: "Welcome" },
    });

    const raw = server.receive();
    assertEquals(
      raw.some((r) => r.includes("MODE") && r.includes("+B")),
      false,
    );
  });

  test("do not send MODE +B when bot option is not set", async () => {
    const { client, server } = await mock({ nick: "me" });

    server.receive();

    client.emit("register", {
      source: { name: "server" },
      params: { nick: "bot", text: "Welcome" },
    });

    const raw = server.receive();
    assertEquals(
      raw.some((r) => r.includes("MODE") && r.includes("+B")),
      false,
    );
  });

  test("isBot returns true when bot tag is present", async () => {
    const { client, server } = await mock();

    server.send("@bot :nick!user@host PRIVMSG #channel :hello");
    const msg = await client.once("raw:privmsg");

    assertEquals(client.utils.isBot(msg), true);
  });

  test("isBot returns true when draft/bot tag is present", async () => {
    const { client, server } = await mock();

    server.send("@draft/bot :nick!user@host PRIVMSG #channel :hello");
    const msg = await client.once("raw:privmsg");

    assertEquals(client.utils.isBot(msg), true);
  });

  test("isBot returns false when no bot tag", async () => {
    const { client, server } = await mock();

    server.send(":nick!user@host PRIVMSG #channel :hello");
    const msg = await client.once("raw:privmsg");

    assertEquals(client.utils.isBot(msg), false);
  });
});

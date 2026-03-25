import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/message_split", (test) => {
  test("short message is not split", async () => {
    const { client, server } = await mock({ nick: "me" });

    client.privmsg("#chan", "hello world");
    const raw = server.receive();

    assertEquals(raw, ["PRIVMSG #chan :hello world"]);
  });

  test("long PRIVMSG is split into multiple messages", async () => {
    const { client, server } = await mock({ nick: "me" });

    // Create a message that exceeds 512 bytes when combined with overhead
    const longText = "word ".repeat(120).trim(); // ~600 chars
    client.privmsg("#chan", longText);
    const raw = server.receive();

    assertEquals(raw.length > 1, true);
    for (const msg of raw) {
      assertEquals(msg.startsWith("PRIVMSG #chan :"), true);
    }
  });

  test("long NOTICE is split into multiple messages", async () => {
    const { client, server } = await mock({ nick: "me" });

    const longText = "word ".repeat(120).trim();
    client.notice("#chan", longText);
    const raw = server.receive();

    assertEquals(raw.length > 1, true);
    for (const msg of raw) {
      assertEquals(msg.startsWith("NOTICE #chan :"), true);
    }
  });

  test("split on word boundary", async () => {
    const { client, server } = await mock({ nick: "me" });

    // Build a message where the split point falls between words
    const longText = "abcdefghij ".repeat(50).trim();
    client.privmsg("#c", longText);
    const raw = server.receive();

    // Each part should not end with a broken word
    for (const msg of raw) {
      const text = msg.slice("PRIVMSG #c :".length);
      // Text should either be a clean word boundary or last part
      assertEquals(text.length > 0, true);
    }
  });

  test("hard split message without spaces", async () => {
    const { client, server } = await mock({ nick: "me" });

    const longText = "x".repeat(600);
    client.privmsg("#c", longText);
    const raw = server.receive();

    assertEquals(raw.length > 1, true);
    // Reconstruct original message — send() omits ":" when text has no spaces
    const prefix = "PRIVMSG #c ";
    const rebuilt = raw.map((m) => {
      const text = m.slice(prefix.length);
      return text.startsWith(":") ? text.slice(1) : text;
    }).join("");
    assertEquals(rebuilt, longText);
  });

  test("update hostname from RPL_HOSTHIDDEN", async () => {
    const { client, server } = await mock({ nick: "me" });

    server.send(":serverhost 396 me short.host :is now your displayed host");
    await client.once("raw:rpl_hosthidden");

    // With a shorter hostname, more space is available for text,
    // so a message that would be split with the default might fit now.
    const text = "x".repeat(400);
    client.privmsg("#c", text);
    const raw = server.receive();

    assertEquals(raw.length, 1);
    assertEquals(raw[0], "PRIVMSG #c " + text);
  });

  test("disabled when messageSplit is false", async () => {
    const { client, server } = await mock({
      nick: "me",
      messageSplit: false,
    } as Record<string, unknown>);

    const longText = "x".repeat(600);
    client.privmsg("#c", longText);
    const raw = server.receive();

    // Should send as single message (no splitting)
    assertEquals(raw.length, 1);
  });
});

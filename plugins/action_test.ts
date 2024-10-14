import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/action", (test) => {
  test("send ACTION", async () => {
    const { client, server } = await mock();

    client.action("#channel", "says hello");
    client.me("someone", "says hello");
    const raw = server.receive();

    assertEquals(raw, [
      "PRIVMSG #channel :\x01ACTION says hello\x01",
      "PRIVMSG someone :\x01ACTION says hello\x01",
    ]);
  });

  test("emit 'ctcp_action' on CTCP ACTION", async () => {
    const { client, server } = await mock();

    server.send(
      ":someone!user@host PRIVMSG #channel :\x01ACTION says hello\x01",
    );
    const msg = await client.once("ctcp_action");

    assertEquals(msg, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "#channel", text: "says hello" },
    });
  });
});

import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { actionPlugin } from "./action.ts";
import { ctcpPlugin } from "./ctcp.ts";

describe("plugins/action", (test) => {
  const plugins = [ctcpPlugin, actionPlugin];

  test("send ACTION", async () => {
    const { client, server } = await mock(plugins, {});

    client.action("#channel", "says hello");
    client.action("someone", "says hello");
    const raw = server.receive();

    assertEquals(raw, [
      "PRIVMSG #channel :\x01ACTION says hello\x01",
      "PRIVMSG someone :\x01ACTION says hello\x01",
    ]);
  });

  test("emit 'ctcp_action' on CTCP ACTION", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(
      ":someone!user@host PRIVMSG #channel :\x01ACTION says hello\x01",
    );
    const msg = await client.once("ctcp_action");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      target: "#channel",
      text: "says hello",
    });
  });
});

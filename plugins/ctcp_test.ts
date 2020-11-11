import { Raw } from "../core/parsers.ts";
import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { ctcp, isCtcp } from "./ctcp.ts";

describe("plugins/ctcp", (test) => {
  const plugins = [ctcp];

  test("send CTCP", async () => {
    const { client, server } = await mock(plugins, {});

    client.ctcp("#channel", "TIME");
    client.ctcp("#channel", "ACTION", "param");
    const raw = server.receive();

    assertEquals(
      raw,
      [
        "PRIVMSG #channel \x01TIME\x01",
        "PRIVMSG #channel :\x01ACTION param\x01",
      ],
    );
  });

  test("emit 'ctcp' on CTCP", async () => {
    const { client, server } = await mock(plugins, {});
    const messages = [];

    server.send(
      ":someone!user@host PRIVMSG #channel :\x01CTCP_COMMAND\x01",
    );
    messages.push(await client.once("ctcp"));

    server.send(
      ":someone!user@host NOTICE #channel :\x01CTCP_COMMAND param\x01",
    );
    messages.push(await client.once("ctcp"));

    assertEquals(messages, [
      {
        origin: { nick: "someone", username: "user", userhost: "host" },
        target: "#channel",
        command: "CTCP_COMMAND",
        type: "query",
      },
      {
        origin: { nick: "someone", username: "user", userhost: "host" },
        target: "#channel",
        command: "CTCP_COMMAND",
        type: "reply",
        param: "param",
      },
    ]);
  });

  test("check CTCP format", () => {
    assertEquals(
      isCtcp({ command: "PRIVMSG", params: ["nick", "Hello world"] } as Raw),
      false,
    );

    assertEquals(
      isCtcp({ command: "NOTICE", params: ["nick", "Hello world"] } as Raw),
      false,
    );

    assertEquals(
      isCtcp({ command: "JOIN", params: ["#channel"] } as Raw),
      false,
    );

    assertEquals(
      isCtcp({ command: "PART", params: ["#channel", "Goodbye!"] } as Raw),
      false,
    );

    assertEquals(
      isCtcp({
        command: "PRIVMSG",
        params: ["nick", "\x01Hello world\x01"],
      } as Raw),
      true,
    );

    assertEquals(
      isCtcp({
        command: "NOTICE",
        params: ["nick", "\x01Hello world\x01"],
      } as Raw),
      true,
    );
  });
});

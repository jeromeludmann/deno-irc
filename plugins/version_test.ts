import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { ctcp } from "./ctcp.ts";
import { version } from "./version.ts";

describe("plugins/version", (test) => {
  const plugins = [ctcp, version];

  test("send VERSION", async () => {
    const { client, server } = await mock(plugins, {});

    client.version();
    client.version("someone");
    const raw = server.receive();

    assertEquals(raw, [
      "VERSION",
      "PRIVMSG someone \x01VERSION\x01",
    ]);
  });

  test("emit 'ctcp_version' on CTCP VERSION query", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host PRIVMSG me :\x01VERSION\x01");
    const msg = await client.once("ctcp_version");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      target: "me",
    });
  });

  test("emit 'ctcp_version_reply' on CTCP VERSION reply", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host NOTICE me :\x01VERSION deno-irc\x01");
    const msg = await client.once("ctcp_version_reply");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      target: "me",
      version: "deno-irc",
    });
  });

  test("reply to CTCP VERSION query", async () => {
    const { client, server } = await mock(
      plugins,
      { ctcpReplies: { version: "custom version" } },
    );

    server.send(":someone!user@host PRIVMSG me :\x01VERSION\x01");
    await client.once("ctcp_version");
    const raw = server.receive();

    assertEquals(raw, ["NOTICE someone :\x01VERSION custom version\x01"]);
  });

  test("not reply to CTCP VERSION query if disabled", async () => {
    const { client, server } = await mock(
      plugins,
      { ctcpReplies: { version: false } },
    );

    server.send(":someone!user@host PRIVMSG me :\x01VERSION\x01");
    await client.once("ctcp_version");
    const raw = server.receive();

    assertEquals(raw, []);
  });
});

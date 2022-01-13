import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { nickPlugin } from "./nick.ts";

describe("plugins/nick", (test) => {
  const plugins = [nickPlugin];

  test("send NICK", async () => {
    const { client, server } = await mock(plugins, {});

    client.nick("new_nick");
    const raw = server.receive();

    assertEquals(raw, ["NICK new_nick"]);
  });

  test("emit 'nick' on NICK", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host NICK me");
    const msg = await client.once("nick");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      nick: "me",
    });
  });
});

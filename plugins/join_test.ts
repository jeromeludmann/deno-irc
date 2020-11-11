import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { join } from "./join.ts";

describe("plugins/join", (test) => {
  const plugins = [join];

  test("send JOIN", async () => {
    const { client, server } = await mock(plugins, {});

    client.join("#channel");
    client.join("#channel1", "#channel2");
    const raw = server.receive();

    assertEquals(raw, [
      "JOIN #channel",
      "JOIN #channel1,#channel2",
    ]);
  });

  test("emit 'join' on JOIN", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host JOIN #channel");
    const msg = await client.once("join");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      channel: "#channel",
    });
  });
});

import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/join", (test) => {
  test("send JOIN", async () => {
    const { client, server } = await mock();

    client.join("#channel");
    client.join(["#channel", "key"]);
    client.join("#channel1", "#channel2");
    client.join("#channel1", ["#channel2", "key2"]);
    client.join(["#channel1", "key1"], "#channel2");
    client.join(["#channel1", "key1"], ["#channel2", "key2"]);
    client.join(["#channel1", "key1"], "#channel2", ["#channel3", "key3"]);
    const raw = server.receive();

    assertEquals(raw, [
      "JOIN #channel",
      "JOIN #channel key",
      "JOIN #channel1,#channel2",
      "JOIN #channel1,#channel2 ,key2",
      "JOIN #channel1,#channel2 key1,",
      "JOIN #channel1,#channel2 key1,key2",
      "JOIN #channel1,#channel2,#channel3 key1,,key3",
    ]);
  });

  test("emit 'join' on JOIN", async () => {
    const { client, server } = await mock();

    server.send(":someone!user@host JOIN #channel");
    const msg = await client.once("join");

    assertEquals(msg, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { channel: "#channel" },
    });
  });
});

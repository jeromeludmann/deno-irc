import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { partPlugin } from "./part.ts";

describe("plugins/part", (test) => {
  const plugins = [partPlugin];

  test("send PART", async () => {
    const { client, server } = await mock(plugins, {});

    client.part("#channel");
    client.part("#channel", "Goodbye!");
    const raw = server.receive();

    assertEquals(raw, [
      "PART #channel",
      "PART #channel Goodbye!",
    ]);
  });

  test("emit 'part' on PART", async () => {
    const { client, server } = await mock(plugins, {});
    const messages = [];

    server.send(":someone!user@host PART #channel");
    messages.push(await client.once("part"));

    server.send(":someone!user@host PART #channel :Goodbye!");
    messages.push(await client.once("part"));

    assertEquals(messages, [
      {
        origin: { nick: "someone", username: "user", userhost: "host" },
        channel: "#channel",
        comment: undefined,
      },
      {
        origin: { nick: "someone", username: "user", userhost: "host" },
        channel: "#channel",
        comment: "Goodbye!",
      },
    ]);
  });
});

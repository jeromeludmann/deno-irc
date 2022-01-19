import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/part", (test) => {
  test("send PART", async () => {
    const { client, server } = await mock();

    client.part("#channel");
    client.part("#channel", "Goodbye!");
    const raw = server.receive();

    assertEquals(raw, [
      "PART #channel",
      "PART #channel Goodbye!",
    ]);
  });

  test("emit 'part' on PART", async () => {
    const { client, server } = await mock();
    const messages = [];

    server.send(":someone!user@host PART #channel");
    messages.push(await client.once("part"));

    server.send(":someone!user@host PART #channel :Goodbye!");
    messages.push(await client.once("part"));

    assertEquals(messages, [
      {
        source: { name: "someone", mask: { user: "user", host: "host" } },
        params: { channel: "#channel", comment: undefined },
      },
      {
        source: { name: "someone", mask: { user: "user", host: "host" } },
        params: { channel: "#channel", comment: "Goodbye!" },
      },
    ]);
  });
});

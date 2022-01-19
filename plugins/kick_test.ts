import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/kick", (test) => {
  test("send KICK", async () => {
    const { client, server } = await mock();

    client.kick("#channel", "someone");
    client.kick("#channel", "someone", "Boom!");
    const raw = server.receive();

    assertEquals(raw, [
      "KICK #channel someone",
      "KICK #channel someone Boom!",
    ]);
  });

  test("emit 'kick' on KILL", async () => {
    const { client, server } = await mock();
    const messages = [];

    server.send(":someone!user@host KICK #channel me");
    messages.push(await client.once("kick"));

    server.send(":someone!user@host KICK #channel me :Boom!");
    messages.push(await client.once("kick"));

    assertEquals(messages, [
      {
        source: { name: "someone", mask: { user: "user", host: "host" } },
        params: { channel: "#channel", nick: "me", comment: undefined },
      },
      {
        source: { name: "someone", mask: { user: "user", host: "host" } },
        params: { channel: "#channel", nick: "me", comment: "Boom!" },
      },
    ]);
  });
});

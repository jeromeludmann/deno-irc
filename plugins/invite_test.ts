import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { invite } from "./invite.ts";

describe("plugins/invite", async (test) => {
  const plugins = [invite];

  test("send INVITE", async () => {
    const { client, server } = await mock(plugins, {});

    client.invite("someone", "#channel");
    const raw = server.receive();

    assertEquals(raw, ["INVITE someone #channel"]);
  });

  test("emit 'invite' on INVITE", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host INVITE me :#channel");
    const msg = await client.once("invite");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      nick: "me",
      channel: "#channel",
    });
  });
});

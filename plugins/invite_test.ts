import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { invitePlugin } from "./invite.ts";

describe("plugins/invite", (test) => {
  const plugins = [invitePlugin];

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

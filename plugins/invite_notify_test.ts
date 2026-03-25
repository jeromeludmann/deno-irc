import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/invite_notify", (test) => {
  test("push 'invite-notify' capability", async () => {
    const { client } = await mock();

    assertEquals(client.state.capabilities.includes("invite-notify"), true);
  });

  test("emit 'invite' for broadcast INVITE", async () => {
    const { client, server } = await mock();

    // With invite-notify, channel members receive INVITE too
    server.send(":nick!user@host INVITE othernick #channel");
    const msg = await client.once("invite");

    assertEquals(msg.params.channel, "#channel");
  });
});

import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { invitePlugin } from "./invite.ts";
import { joinPlugin } from "./join.ts";
import { joinOnInvitePlugin } from "./join_on_invite.ts";
import { nickPlugin } from "./nick.ts";
import { registerPlugin } from "./register.ts";
import { registrationPlugin } from "./registration.ts";

describe("plugins/join_on_invite", (test) => {
  const plugins = [
    joinPlugin,
    invitePlugin,
    nickPlugin,
    registerPlugin,
    registrationPlugin,
    joinOnInvitePlugin,
  ];

  const options = { nick: "me" };

  test("join on INVITE", async () => {
    const { client, server } = await mock(
      plugins,
      { ...options, joinOnInvite: true },
    );

    server.send(":someone!user@host INVITE me :#channel");
    await client.once("invite");
    const raw = server.receive();

    assertEquals(raw, ["JOIN #channel"]);
  });

  test("not join on INVITE if disabled", async () => {
    const { client, server } = await mock(
      plugins,
      { ...options, joinOnInvite: false },
    );

    server.send(":someone!user@host INVITE me :#channel");
    await client.once("raw");
    const raw = server.receive();

    assertEquals(raw, []);
  });
});

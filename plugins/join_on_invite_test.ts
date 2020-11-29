import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { invite } from "./invite.ts";
import { join } from "./join.ts";
import { joinOnInvite } from "./join_on_invite.ts";
import { nick } from "./nick.ts";
import { register } from "./register.ts";
import { registerOnConnect } from "./register_on_connect.ts";

describe("plugins/join_on_invite", (test) => {
  const plugins = [
    join,
    invite,
    nick,
    register,
    registerOnConnect,
    joinOnInvite,
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

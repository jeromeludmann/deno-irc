import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/join_on_invite", (test) => {
  test("join on INVITE", async () => {
    const { client, server } = await mock({ joinOnInvite: true });

    server.send(":someone!user@host INVITE me :#channel");
    await client.once("invite");
    const raw = server.receive();

    assertEquals(raw, ["JOIN #channel"]);
  });

  test("not join on INVITE if disabled", async () => {
    const { client, server } = await mock({ joinOnInvite: false });

    server.send(":someone!user@host INVITE me :#channel");
    await client.once("raw:invite");
    const raw = server.receive();

    assertEquals(raw, []);
  });
});

import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/invite", (test) => {
  test("send INVITE", async () => {
    const { client, server } = await mock();

    client.invite("someone", "#channel");
    const raw = server.receive();

    assertEquals(raw, ["INVITE someone #channel"]);
  });

  test("emit 'invite' on INVITE", async () => {
    const { client, server } = await mock();

    server.send(":someone!user@host INVITE me :#channel");
    const msg = await client.once("invite");

    assertEquals(msg, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { nick: "me", channel: "#channel" },
    });
  });
});

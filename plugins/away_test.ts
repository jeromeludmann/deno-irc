import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/away", (test) => {
  test("send AWAY", async () => {
    const { client, server } = await mock();

    client.away("I'm busy");
    client.away();
    client.back();

    const raw = server.receive();

    assertEquals(raw, [
      "AWAY :I'm busy",
      "AWAY",
      "AWAY",
    ]);
  });

  test("emit 'away_reply' on RPL_AWAY", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 301 client nick :I'm busy");
    const msg = await client.once("away_reply");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: { nick: "nick", text: "I'm busy" },
    });
  });

  test("update away state on RPL_NOWAWAY/RPL_UNAWAY", async () => {
    const { client, server } = await mock();

    assertEquals(client.state.away, false);

    server.send(":serverhost 306 me :You have been marked as being away");
    await client.once("raw:rpl_nowaway");

    assertEquals(client.state.away, true);

    server.send(":serverhost 305 me :You are no longer marked as being away");
    await client.once("raw:rpl_unaway");

    assertEquals(client.state.away, false);
  });
});

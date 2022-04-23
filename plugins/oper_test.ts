import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/oper", (test) => {
  test("send OPER", async () => {
    const { client, server } = await mock();

    client.oper("user", "pass");
    const raw = server.receive();

    assertEquals(raw, ["OPER user pass"]);
  });

  test("update oper state on RPL_YOUREOPER", async () => {
    const { client, server } = await mock();

    assertEquals(client.state.oper, false);

    server.send(
      ":serverhost 381 me :You are now an IRC operator",
    );
    await client.once("raw:rpl_youreoper");

    assertEquals(client.state.oper, true);
  });

  test("reset oper state on disconnect", async () => {
    const { client, server } = await mock();

    server.send(
      ":serverhost 381 me :You are now an IRC operator",
    );
    await client.once("raw:rpl_youreoper");

    assertEquals(client.state.oper, true);

    server.shutdown();
    await client.once("disconnected");

    assertEquals(client.state.oper, false);
  });

  test("reset oper state on error", async () => {
    const { client, server } = await mock();

    server.send(
      ":serverhost 381 me :You are now an IRC operator",
    );
    await client.once("raw:rpl_youreoper");

    assertEquals(client.state.oper, true);

    server.send("ERROR :Closing link: (user@host) [Client exited]");
    await client.once("error");

    assertEquals(client.state.oper, false);
  });
});

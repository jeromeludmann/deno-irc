import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/motd", (test) => {
  test("send MOTD", async () => {
    const { client, server } = await mock();

    client.motd();
    const raw = server.receive();

    assertEquals(raw, ["MOTD"]);
  });

  test("emit 'motd' on RPL_ENDOFMOTD", async () => {
    const { client, server } = await mock();

    const receiveMotd = () =>
      server.send([
        ":serverhost 375 nick :- serverhost Message of the day - ",
        ":serverhost 372 nick :- Welcome to the",
        ":serverhost 372 nick :- fake server!",
        ":serverhost 376 nick :End of MOTD command",
      ]);

    receiveMotd();
    await client.once("motd");

    receiveMotd();
    const msg = await client.once("motd");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: {
        motd: [
          "- Welcome to the",
          "- fake server!",
        ],
      },
    });
  });

  test("emit 'motd' on ERR_NOMOTD", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 422 nick :MOTD File is missing");
    const msg = await client.once("motd");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: { motd: undefined },
    });
  });
});

import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { motd } from "./motd.ts";

describe("plugins/motd", (test) => {
  const plugins = [motd];

  test("send MOTD", async () => {
    const { client, server } = await mock(plugins, {});

    client.motd();
    const raw = server.receive();

    assertEquals(raw, ["MOTD"]);
  });

  test("emit 'motd' on RPL_ENDOFMOTD", async () => {
    const { client, server } = await mock(plugins, {});

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
      motd: [
        "- Welcome to the",
        "- fake server!",
      ],
    });
  });

  test("emit 'motd' on ERR_NOMOTD", async () => {
    const { client, server } = await mock([motd], {});

    server.send(":serverhost 422 nick :MOTD File is missing");
    const msg = await client.once("motd");

    assertEquals(msg, {
      motd: undefined,
    });
  });
});

import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { listPlugin } from "./list.ts";

describe("plugins/list", (test) => {
  const plugins = [listPlugin];

  test("send LIST", async () => {
    const { client, server } = await mock(plugins, {});

    client.list();
    client.list("#chan");
    client.list("#chan", "host");
    client.list(["#chan1", "#chan2"]);
    client.list(["#chan1", "#chan2"], "host");
    const raw = server.receive();

    assertEquals(raw, [
      "LIST",
      "LIST #chan",
      "LIST #chan host",
      "LIST #chan1,#chan2",
      "LIST #chan1,#chan2 host",
    ]);
  });

  test("emit 'list_reply' on RPL_LISTEND", async () => {
    const { client, server } = await mock(plugins, {});

    server.send([
      ":serverhost 322 me #chan1 12 :Welcome to #channel",
      ":serverhost 322 me #chan2 23",
      ":serverhost 322 me #chan3 34 :",
      ":serverhost 323 me :End of /LIST",
    ]);
    const msg = await client.once("list_reply");

    assertEquals(msg, {
      channels: [
        { channel: "#chan1", count: 12, topic: "Welcome to #channel" },
        { channel: "#chan2", count: 23, topic: "" },
        { channel: "#chan3", count: 34, topic: "" },
      ],
    });
  });
});

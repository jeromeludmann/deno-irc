import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/list", (test) => {
  test("send LIST", async () => {
    const { client, server } = await mock();

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
    const { client, server } = await mock();

    server.send([
      ":serverhost 321 me Channel :Users Name",
      ":serverhost 322 me #chan1 12 :Welcome to #channel",
      ":serverhost 322 me #chan2 23",
      ":serverhost 322 me #chan3 34 :",
      ":serverhost 323 me :End of /LIST",
    ]);
    const msg = await client.once("list_reply");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: {
        channels: [
          { name: "#chan1", count: 12, topic: "Welcome to #channel" },
          { name: "#chan2", count: 23, topic: "" },
          { name: "#chan3", count: 34, topic: "" },
        ],
      },
    });
  });
});

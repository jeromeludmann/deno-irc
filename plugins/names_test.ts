import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/names", (test) => {
  test("send NAMES", async () => {
    const { client, server } = await mock();

    client.names("#channel");
    client.names(["#channel1", "#channel2"]);
    const raw = server.receive();

    assertEquals(raw, [
      "NAMES #channel",
      "NAMES #channel1,#channel2",
    ]);
  });

  test("emit 'names_reply' on RPL_ENDOFNAMES", async () => {
    const { client, server } = await mock();

    server.send([
      ":serverhost 353 me = #channel :%nick1 @+nick2 +nick3",
      ":serverhost 353 me = #channel :+nick4 @%+nick5 nick6",
      ":serverhost 366 me #channel :End of /NAMES list",
    ]);
    const msg = await client.once("names_reply");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: {
        channel: "#channel",
        names: {
          "nick1": ["", "%", ""],
          "nick2": ["@", "", "+"],
          "nick4": ["", "", "+"],
          "nick3": ["", "", "+"],
          "nick5": ["@", "%", "+"],
          "nick6": ["", "", ""],
        },
      },
    });
  });

  test("emit 'names_reply' on RPL_ISUPPORT + RPL_ENDOFNAMES", async () => {
    const { client, server } = await mock();

    server.send(
      ":serverhost 005 nick PREFIX=(qaohv)~&@%+ :are supported by this server",
    );
    await client.once("raw:rpl_isupport");

    server.send([
      ":serverhost 353 me = #channel :~@+nick1 &%nick2",
      ":serverhost 366 me #channel :End of /NAMES list",
    ]);
    const msg = await client.once("names_reply");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: {
        channel: "#channel",
        names: {
          "nick1": ["~", "", "@", "", "+"],
          "nick2": ["", "&", "", "%", ""],
        },
      },
    });
  });
});

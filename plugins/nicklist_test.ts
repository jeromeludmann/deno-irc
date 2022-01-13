import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { isupportPlugin } from "./isupport.ts";
import { joinPlugin } from "./join.ts";
import { kickPlugin } from "./kick.ts";
import { killPlugin } from "./kill.ts";
import { modePlugin } from "./mode.ts";
import { namesPlugin } from "./names.ts";
import { partPlugin } from "./part.ts";
import { quitPlugin } from "./quit.ts";
import { type NicklistEvent, nicklistPlugin } from "./nicklist.ts";

describe("plugins/nicklist", (test) => {
  const plugins = [
    isupportPlugin,
    joinPlugin,
    kickPlugin,
    killPlugin,
    modePlugin,
    namesPlugin,
    partPlugin,
    quitPlugin,
    nicklistPlugin,
  ];

  test("update nicklist state on RPL_ENDOFNAMES", async () => {
    const { client, server } = await mock(plugins, { nick: "me" });

    server.send([
      ":serverhost 353 me @ #channel1 :nick1 +nick2 %+nick3",
      ":serverhost 353 me @ #channel1 :@%+nick4 +nick5",
      ":serverhost 353 me @ #channel1 :nick6",
      ":serverhost 366 me #channel1 :End of /NAMES list",
      ":serverhost 353 me = #channel2 :%+nick1 +nick2 @%+nick3 %nick4",
      ":serverhost 353 me = #channel2 :+nick5 @+nick6",
      ":serverhost 366 me #channel2 :End of /NAMES list",
    ]);
    await client.once("names_reply");

    assertEquals(client.state.nicklists, {
      "#channel1": [
        { prefix: "@", nick: "nick4" },
        { prefix: "%", nick: "nick3" },
        { prefix: "+", nick: "nick2" },
        { prefix: "+", nick: "nick5" },
        { prefix: "", nick: "nick1" },
        { prefix: "", nick: "nick6" },
      ],
      "#channel2": [
        { prefix: "@", nick: "nick3" },
        { prefix: "@", nick: "nick6" },
        { prefix: "%", nick: "nick1" },
        { prefix: "%", nick: "nick4" },
        { prefix: "+", nick: "nick2" },
        { prefix: "+", nick: "nick5" },
      ],
    });
  });

  test("emit 'nicklist' on various messages", async () => {
    const { client, server } = await mock(plugins, { nick: "me" });

    server.send([
      ":serverhost 353 me = #channel :@%+nick1 +nick2 nick3",
      ":serverhost 366 me #channel :End of /NAMES list",
    ]);
    assertEquals(await client.once("nicklist"), {
      channel: "#channel",
      nicklist: [
        { prefix: "@", nick: "nick1" },
        { prefix: "+", nick: "nick2" },
        { prefix: "", nick: "nick3" },
      ],
    });

    server.send(":nick4!user@host JOIN #channel");
    assertEquals(await client.once("nicklist"), {
      channel: "#channel",
      nicklist: [
        { prefix: "@", nick: "nick1" },
        { prefix: "+", nick: "nick2" },
        { prefix: "", nick: "nick3" },
        { prefix: "", nick: "nick4" },
      ],
    });

    const messages: NicklistEvent[] = [];
    client.on("nicklist", (msg) => messages.push(msg));
    server.send(":nick1!user@host MODE #channel +ov nick2 nick3");
    await client.once("nicklist");
    assertEquals(messages, [{
      channel: "#channel",
      nicklist: [
        { prefix: "@", nick: "nick1" },
        { prefix: "@", nick: "nick2" },
        { prefix: "", nick: "nick3" },
        { prefix: "", nick: "nick4" },
      ],
    }, {
      channel: "#channel",
      nicklist: [
        { prefix: "@", nick: "nick1" },
        { prefix: "@", nick: "nick2" },
        { prefix: "+", nick: "nick3" },
        { prefix: "", nick: "nick4" },
      ],
    }]);

    server.send(":nick1!user@host KICK #channel nick3");
    assertEquals(await client.once("nicklist"), {
      channel: "#channel",
      nicklist: [
        { prefix: "@", nick: "nick1" },
        { prefix: "@", nick: "nick2" },
        { prefix: "", nick: "nick4" },
      ],
    });

    server.send(":nick1!user@host MODE #channel +h nick2");
    assertEquals(await client.once("nicklist"), {
      channel: "#channel",
      nicklist: [
        { prefix: "@", nick: "nick1" },
        { prefix: "@", nick: "nick2" },
        { prefix: "", nick: "nick4" },
      ],
    });

    server.send(":nick1!user@host MODE #channel -o nick2");
    assertEquals(await client.once("nicklist"), {
      channel: "#channel",
      nicklist: [
        { prefix: "@", nick: "nick1" },
        { prefix: "%", nick: "nick2" },
        { prefix: "", nick: "nick4" },
      ],
    });

    server.send(":nick2!user@host PART #channel");
    assertEquals(await client.once("nicklist"), {
      channel: "#channel",
      nicklist: [
        { prefix: "@", nick: "nick1" },
        { prefix: "", nick: "nick4" },
      ],
    });

    server.send(":nick4!user@host QUIT");
    assertEquals(await client.once("nicklist"), {
      channel: "#channel",
      nicklist: [
        { prefix: "@", nick: "nick1" },
      ],
    });

    server.send(":oper!user@host KILL nick1 Boom!");
    assertEquals(await client.once("nicklist"), {
      channel: "#channel",
      nicklist: [],
    });
  });
});

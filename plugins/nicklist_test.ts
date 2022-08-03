import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { type NicklistEvent } from "./nicklist.ts";

describe("plugins/nicklist", (test) => {
  test("initialize nicklists state", async () => {
    const { client } = await mock();

    assertEquals(client.state.nicklists, {});
  });

  test("update nicklists state on RPL_ENDOFNAMES", async () => {
    const { client, server } = await mock();

    server.send([
      ":serverhost 353 me @ #channel1 :+nick5 @%+nick4 +nick2",
      ":serverhost 353 me @ #channel1 :nick6 %+nick3 nick1",
      ":serverhost 366 me #channel1 :End of /NAMES list",
      ":serverhost 353 me = #channel2 :@+nick6 @%+nick3 %+nick1",
      ":serverhost 353 me = #channel2 :+nick5 %nick4 +nick2",
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

  test("emit 'nicklist' on RPL_NAMREPLY + RPL_ENDOFNAMES", async () => {
    const { client, server } = await mock();

    server.send([
      ":serverhost 353 me = #channel :@%+nick1 +nick2 nick3",
      ":serverhost 366 me #channel :End of /NAMES list",
    ]);
    const msg = await client.once("nicklist");

    assertEquals(msg, {
      params: {
        channel: "#channel",
        nicklist: [
          { prefix: "@", nick: "nick1" },
          { prefix: "+", nick: "nick2" },
          { prefix: "", nick: "nick3" },
        ],
      },
    });
  });

  test("emit 'nicklist' on JOIN", async () => {
    const { client, server } = await mock();

    server.send([
      ":serverhost 353 me = #channel :@%+nick1 +nick2 nick3",
      ":serverhost 366 me #channel :End of /NAMES list",
    ]);
    await client.once("names_reply");

    server.send(":nick4!user@host JOIN #channel");
    const msg = await client.once("nicklist");

    assertEquals(msg, {
      params: {
        channel: "#channel",
        nicklist: [
          { prefix: "@", nick: "nick1" },
          { prefix: "+", nick: "nick2" },
          { prefix: "", nick: "nick3" },
          { prefix: "", nick: "nick4" },
        ],
      },
    });
  });

  test("do no emit 'nicklist' on JOIN from empty sources", async () => {
    const { client, server } = await mock();
    let triggered = 0;

    client.on("nicklist", () => triggered++);

    server.send("JOIN #channel");

    assertEquals(triggered, 0);
  });

  test("emit 'nicklist' on NICK", async () => {
    const { client, server } = await mock();
    const messages: NicklistEvent[] = [];

    server.send([
      ":serverhost 353 me = #channel1 :@%+nick1 +nick2 nick3",
      ":serverhost 366 me #channel1 :End of /NAMES list",
      ":serverhost 353 me = #channel2 :@nick1 nick2 nick3",
      ":serverhost 366 me #channel2 :End of /NAMES list",
    ]);
    await client.once("names_reply");

    client.on("nicklist", (msg) => messages.push(msg));

    server.send(":nick2!user@host NICK nick4");
    await client.once("nicklist");

    assertEquals(messages, [{
      params: {
        channel: "#channel1",
        nicklist: [
          { prefix: "@", nick: "nick1" },
          { prefix: "+", nick: "nick4" },
          { prefix: "", nick: "nick3" },
        ],
      },
    }, {
      params: {
        channel: "#channel2",
        nicklist: [
          { prefix: "@", nick: "nick1" },
          { prefix: "", nick: "nick3" },
          { prefix: "", nick: "nick4" },
        ],
      },
    }]);
  });

  test("do no emit 'nicklist' on NICK from empty sources", async () => {
    const { client, server } = await mock();
    let triggered = 0;

    client.on("nicklist", () => triggered++);

    server.send("NICK nick");

    assertEquals(triggered, 0);
  });

  test("emit 'nicklist' on MODE", async () => {
    const { client, server } = await mock();
    const messages: NicklistEvent[] = [];

    server.send([
      ":serverhost 353 me = #channel :@%+nick1 +nick2 nick3",
      ":serverhost 366 me #channel :End of /NAMES list",
    ]);
    await client.once("names_reply");

    client.on("nicklist", (msg) => messages.push(msg));

    server.send(":nick1!user@host MODE #channel +ov nick2 nick3");
    await client.once("nicklist");

    server.send(":nick1!user@host MODE #channel +h nick2");
    await client.once("nicklist");

    server.send(":nick1!user@host MODE #channel -o nick2");
    await client.once("nicklist");

    assertEquals(messages, [{
      params: {
        channel: "#channel",
        nicklist: [
          { prefix: "@", nick: "nick1" },
          { prefix: "@", nick: "nick2" },
          { prefix: "", nick: "nick3" },
        ],
      },
    }, {
      params: {
        channel: "#channel",
        nicklist: [
          { prefix: "@", nick: "nick1" },
          { prefix: "@", nick: "nick2" },
          { prefix: "+", nick: "nick3" },
        ],
      },
    }, {
      params: {
        channel: "#channel",
        nicklist: [
          { prefix: "@", nick: "nick1" },
          { prefix: "@", nick: "nick2" },
          { prefix: "+", nick: "nick3" },
        ],
      },
    }, {
      params: {
        channel: "#channel",
        nicklist: [
          { prefix: "@", nick: "nick1" },
          { prefix: "%", nick: "nick2" },
          { prefix: "+", nick: "nick3" },
        ],
      },
    }]);
  });

  test("emit 'nicklist' on KICK", async () => {
    const { client, server } = await mock();

    server.send([
      ":serverhost 353 me = #channel :@%+nick1 +nick2 nick3",
      ":serverhost 366 me #channel :End of /NAMES list",
    ]);
    await client.once("names_reply");

    server.send(":nick1!user@host KICK #channel nick3");
    const msg = await client.once("nicklist");

    assertEquals(msg, {
      params: {
        channel: "#channel",
        nicklist: [
          { prefix: "@", nick: "nick1" },
          { prefix: "+", nick: "nick2" },
        ],
      },
    });
  });

  test("emit 'nicklist' on PART", async () => {
    const { client, server } = await mock();

    server.send([
      ":serverhost 353 me = #channel :@%+nick1 +nick2 nick3",
      ":serverhost 366 me #channel :End of /NAMES list",
    ]);
    await client.once("names_reply");

    server.send(":nick2!user@host PART #channel");
    const msg = await client.once("nicklist");

    assertEquals(msg, {
      params: {
        channel: "#channel",
        nicklist: [
          { prefix: "@", nick: "nick1" },
          { prefix: "", nick: "nick3" },
        ],
      },
    });
  });

  test("emit 'nicklist' on QUIT", async () => {
    const { client, server } = await mock();
    const messages: NicklistEvent[] = [];

    server.send([
      ":serverhost 353 me = #channel1 :@%+nick1 +nick2 nick3",
      ":serverhost 366 me #channel1 :End of /NAMES list",
      ":serverhost 353 me = #channel2 :%nick1 nick2 +nick3",
      ":serverhost 366 me #channel2 :End of /NAMES list",
    ]);
    await client.once("names_reply");

    client.on("nicklist", (msg) => messages.push(msg));

    server.send(":nick3!user@host QUIT");
    await client.once("nicklist");

    assertEquals(messages, [{
      params: {
        channel: "#channel1",
        nicklist: [
          { prefix: "@", nick: "nick1" },
          { prefix: "+", nick: "nick2" },
        ],
      },
    }, {
      params: {
        channel: "#channel2",
        nicklist: [
          { prefix: "%", nick: "nick1" },
          { prefix: "", nick: "nick2" },
        ],
      },
    }]);
  });

  test("emit 'nicklist' on KILL", async () => {
    const { client, server } = await mock();
    const messages: NicklistEvent[] = [];

    server.send([
      ":serverhost 353 me = #channel1 :@%+nick1 +nick2 nick3",
      ":serverhost 366 me #channel1 :End of /NAMES list",
      ":serverhost 353 me = #channel2 :+nick1 nick2",
      ":serverhost 366 me #channel2 :End of /NAMES list",
    ]);
    await client.once("names_reply");

    client.on("nicklist", (msg) => messages.push(msg));

    server.send(":oper!user@host KILL nick1 Boom!");
    await client.once("nicklist");

    assertEquals(messages, [{
      params: {
        channel: "#channel1",
        nicklist: [
          { prefix: "+", nick: "nick2" },
          { prefix: "", nick: "nick3" },
        ],
      },
    }, {
      params: {
        channel: "#channel2",
        nicklist: [
          { prefix: "", nick: "nick2" },
        ],
      },
    }]);
  });

  test("send NAMES through client.nicklist", async () => {
    const { client, server } = await mock();

    client.nicklist("#channel");
    const raw = server.receive();

    assertEquals(raw, ["NAMES #channel"]);
  });
});

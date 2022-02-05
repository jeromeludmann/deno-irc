import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { type ModeEvent } from "./mode.ts";

describe("plugins/mode", (test) => {
  test("send MODE", async () => {
    const { client, server } = await mock();

    client.mode("nick");
    client.mode("nick", "+w");
    client.mode("#channel");
    client.mode("#channel", "+i");
    client.mode("#channel", "+mv", "nick1");
    client.mode("#channel", "+m-v", "nick1");
    client.mode("#channel", "+o-hv", "nick1", "nick2", "nick3");
    const raw = server.receive();

    assertEquals(raw, [
      "MODE nick",
      "MODE nick +w",
      "MODE #channel",
      "MODE #channel +i",
      "MODE #channel +mv nick1",
      "MODE #channel +m-v nick1",
      "MODE #channel +o-hv nick1 nick2 nick3",
    ]);
  });

  test("emit 'mode' on MODE nick +i (from server)", async () => {
    const { client, server } = await mock();

    server.send(":serverhost MODE nick +i");
    const msg = await client.once("mode");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: { target: "nick", mode: "+i" },
    });
  });

  test("emit 'mode' on MODE nick +i (from user)", async () => {
    const { client, server } = await mock();

    server.send(":someone!user@host MODE nick +i");
    const msg = await client.once("mode");

    assertEquals(msg, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "nick", mode: "+i" },
    });
  });

  test("emit 'mode' on MODE nick -iw", async () => {
    const { client, server } = await mock();

    const messages: ModeEvent[] = [];
    client.on("mode", (msg) => messages.push(msg));
    server.send(":someone!user@host MODE nick -iw");
    await client.once("mode");

    assertEquals(messages, [{
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "nick", mode: "-i" },
    }, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "nick", mode: "-w" },
    }]);
  });

  test("emit 'mode' on MODE nick +i-w", async () => {
    const { client, server } = await mock();

    const messages: ModeEvent[] = [];
    client.on("mode", (msg) => messages.push(msg));
    server.send(":someone!user@host MODE nick +i-w");
    await client.once("mode");

    assertEquals(messages, [{
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "nick", mode: "+i" },
    }, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "nick", mode: "-w" },
    }]);
  });

  test("emit 'mode' on MODE #channel +i-w", async () => {
    const { client, server } = await mock();

    server.send(":someone!user@host MODE #channel +m");
    const msg = await client.once("mode");

    assertEquals(msg, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "#channel", mode: "+m" },
    });
  });

  test("emit 'mode' on MODE #channel -mv nick", async () => {
    const { client, server } = await mock();

    const messages: ModeEvent[] = [];
    client.on("mode", (msg) => messages.push(msg));
    server.send(":someone!user@host MODE #channel -mv nick");
    await client.once("mode");

    assertEquals(messages, [{
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "#channel", mode: "-m" },
    }, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "#channel", mode: "-v", arg: "nick" },
    }]);
  });

  test("emit 'mode' on MODE #channel +v-m nick", async () => {
    const { client, server } = await mock();

    const messages: ModeEvent[] = [];
    client.on("mode", (msg) => messages.push(msg));
    server.send(":someone!user@host MODE #channel +v-m nick");
    await client.once("mode");

    assertEquals(messages, [{
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "#channel", mode: "+v", arg: "nick" },
    }, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "#channel", mode: "-m" },
    }]);
  });

  test("emit 'mode' on MODE #channel +o-v nick1 nick2", async () => {
    const { client, server } = await mock();

    const messages: ModeEvent[] = [];
    client.on("mode", (msg) => messages.push(msg));
    server.send(":someone!user@host MODE #channel +o-v nick1 nick2");
    await client.once("mode");

    assertEquals(messages, [{
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "#channel", mode: "+o", arg: "nick1" },
    }, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "#channel", mode: "-v", arg: "nick2" },
    }]);
  });

  test("emit 'mode' on MODE #channel +ohk-mv nick1 nick2 secret nick3", async () => {
    const { client, server } = await mock();

    const messages: ModeEvent[] = [];
    client.on("mode", (msg) => messages.push(msg));
    server.send(
      ":someone!user@host MODE #channel +ohk-mv nick1 nick2 secret nick3",
    );
    await client.once("mode");

    assertEquals(messages, [{
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "#channel", mode: "+o", arg: "nick1" },
    }, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "#channel", mode: "+h", arg: "nick2" },
    }, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "#channel", mode: "+k", arg: "secret" },
    }, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "#channel", mode: "-m" },
    }, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "#channel", mode: "-v", arg: "nick3" },
    }]);
  });

  test("emit 'mode:user' on MODE nick +i", async () => {
    const { client, server } = await mock();

    server.send(":someone!user@host MODE nick +i");
    const msg = await client.once("mode:user");

    assertEquals(msg, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "nick", mode: "+i" },
    });
  });

  test("emit 'mode:channel' on MODE #channel +m", async () => {
    const { client, server } = await mock();

    server.send(":someone!user@host MODE #channel +m");
    const msg = await client.once("mode:channel");

    assertEquals(msg, {
      source: { name: "someone", mask: { user: "user", host: "host" } },
      params: { target: "#channel", mode: "+m" },
    });
  });

  test("emit 'mode_reply:user' on RPL_UMODEIS nick +wxp", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 221 nick +iow");
    const msg = await client.once("mode_reply:user");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: {
        target: "nick",
        modes: [
          { mode: "+i" },
          { mode: "+o" },
          { mode: "+w" },
        ],
      },
    });
  });

  test("emit 'mode_reply:channel' on RPL_CHANNELMODEIS #channel +ntkr secret", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 324 #channel +ntkr secret");
    const msg = await client.once("mode_reply:channel");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: {
        target: "#channel",
        modes: [
          { mode: "+n" },
          { mode: "+t" },
          { mode: "+k", arg: "secret" },
          { mode: "+r" },
        ],
      },
    });
  });
});
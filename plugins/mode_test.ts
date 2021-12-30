import { assertEquals } from "../deps.ts";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";
import { isupportPlugin } from "./isupport.ts";
import { type ModeEvent, modePlugin } from "./mode.ts";

describe("plugins/mode", (test) => {
  const plugins = [isupportPlugin, modePlugin];

  test("send MODE", async () => {
    const { client, server } = await mock(plugins, {});

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

  test("emit 'mode' on MODE +i", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host MODE nick +i");
    const msg = await client.once("mode");

    assertEquals(msg, {
      prefix: "someone!user@host",
      target: "nick",
      mode: "+i",
    });
  });

  test("emit 'mode' on MODE nick -iw", async () => {
    const { client, server } = await mock(plugins, {});

    const messages: ModeEvent[] = [];
    client.on("mode", (msg) => messages.push(msg));
    server.send(":someone!user@host MODE nick -iw");
    await client.once("mode");

    assertEquals(messages, [{
      prefix: "someone!user@host",
      target: "nick",
      mode: "-i",
    }, {
      prefix: "someone!user@host",
      target: "nick",
      mode: "-w",
    }]);
  });

  test("emit 'mode' on MODE nick +i-w", async () => {
    const { client, server } = await mock(plugins, {});

    const messages: ModeEvent[] = [];
    client.on("mode", (msg) => messages.push(msg));
    server.send(":someone!user@host MODE nick +i-w");
    await client.once("mode");

    assertEquals(messages, [{
      prefix: "someone!user@host",
      target: "nick",
      mode: "+i",
    }, {
      prefix: "someone!user@host",
      target: "nick",
      mode: "-w",
    }]);
  });

  test("emit 'mode' on MODE #channel +i-w", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host MODE #channel +m");
    const msg = await client.once("mode");

    assertEquals(msg, {
      prefix: "someone!user@host",
      target: "#channel",
      mode: "+m",
    });
  });

  test("emit 'mode' on MODE #channel -mv nick", async () => {
    const { client, server } = await mock(plugins, {});

    const messages: ModeEvent[] = [];
    client.on("mode", (msg) => messages.push(msg));
    server.send(":someone!user@host MODE #channel -mv nick");
    await client.once("mode");

    assertEquals(messages, [{
      prefix: "someone!user@host",
      target: "#channel",
      mode: "-m",
    }, {
      prefix: "someone!user@host",
      target: "#channel",
      mode: "-v",
      arg: "nick",
    }]);
  });

  test("emit 'mode' on MODE #channel +v-m nick", async () => {
    const { client, server } = await mock(plugins, {});

    const messages: ModeEvent[] = [];
    client.on("mode", (msg) => messages.push(msg));
    server.send(":someone!user@host MODE #channel +v-m nick");
    await client.once("mode");

    assertEquals(messages, [{
      prefix: "someone!user@host",
      target: "#channel",
      mode: "+v",
      arg: "nick",
    }, {
      prefix: "someone!user@host",
      target: "#channel",
      mode: "-m",
    }]);
  });

  test("emit 'mode' on MODE #channel +o-v nick1 nick2", async () => {
    const { client, server } = await mock(plugins, {});

    const messages: ModeEvent[] = [];
    client.on("mode", (msg) => messages.push(msg));
    server.send(":someone!user@host MODE #channel +o-v nick1 nick2");
    await client.once("mode");

    assertEquals(messages, [{
      prefix: "someone!user@host",
      target: "#channel",
      mode: "+o",
      arg: "nick1",
    }, {
      prefix: "someone!user@host",
      target: "#channel",
      mode: "-v",
      arg: "nick2",
    }]);
  });

  test("emit 'mode' on MODE #channel +ohk-mv nick1 nick2 secret nick3", async () => {
    const { client, server } = await mock(plugins, {});

    const messages: ModeEvent[] = [];
    client.on("mode", (msg) => messages.push(msg));
    server.send(
      ":someone!user@host MODE #channel +ohk-mv nick1 nick2 secret nick3",
    );
    await client.once("mode");

    assertEquals(messages, [{
      prefix: "someone!user@host",
      target: "#channel",
      mode: "+o",
      arg: "nick1",
    }, {
      prefix: "someone!user@host",
      target: "#channel",
      mode: "+h",
      arg: "nick2",
    }, {
      prefix: "someone!user@host",
      target: "#channel",
      mode: "+k",
      arg: "secret",
    }, {
      prefix: "someone!user@host",
      target: "#channel",
      mode: "-m",
    }, {
      prefix: "someone!user@host",
      target: "#channel",
      mode: "-v",
      arg: "nick3",
    }]);
  });

  test("emit 'mode:user' on MODE nick +i", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host MODE nick +i");
    const msg = await client.once("mode:user");

    assertEquals(msg, {
      nick: "nick",
      mode: "+i",
    });
  });

  test("emit 'mode:channel' on MODE #channel +m", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":someone!user@host MODE #channel +m");
    const msg = await client.once("mode:channel");

    assertEquals(msg, {
      origin: { nick: "someone", username: "user", userhost: "host" },
      channel: "#channel",
      mode: "+m",
    });
  });

  test("emit 'mode_reply:user' on RPL_UMODEIS nick +wxp", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":serverhost 221 nick +iow");
    const msg = await client.once("mode_reply:user");

    assertEquals(msg, {
      nick: "nick",
      modes: [
        { mode: "+i" },
        { mode: "+o" },
        { mode: "+w" },
      ],
    });
  });

  test("emit 'mode_reply:channel' on RPL_CHANNELMODEIS #channel +ntkr secret", async () => {
    const { client, server } = await mock(plugins, {});

    server.send(":serverhost 324 #channel +ntkr secret");
    const msg = await client.once("mode_reply:channel");

    assertEquals(msg, {
      channel: "#channel",
      modes: [
        { mode: "+n" },
        { mode: "+t" },
        { mode: "+k", arg: "secret" },
        { mode: "+r" },
      ],
    });
  });
});

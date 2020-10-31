import { Events } from "./client.ts";
import { EventEmitter } from "./core/events.ts";
import { assertEquals } from "./core/test_deps.ts";
import { Client, Options } from "./mod.ts";

// Typing errors mean there are missing param intersections.
// They should be added to `Params`, defined in `client.ts`.

Deno.test("client options", async () => {
  const options: Required<Options> = {
    bufferSize: 512,
    password: "secret",
    nick: "nick",
    username: "user",
    realname: "real name",
    channels: ["#channel"],
    oper: {
      user: "user",
      pass: "secret",
    },
    joinOnInvite: true,
    ctcpReplies: {
      clientinfo: true,
      ping: true,
      time: true,
      version: true,
    },
    debug: false,
  };

  const client = new Client(options);

  assertEquals(client.options, options);
});

Deno.test("client commands", async () => {
  const client = new Client({ nick: "nick" });

  assertEquals(typeof client.action, "function");
  assertEquals(typeof client.me, "function");
  assertEquals(typeof client.clientinfo, "function");
  assertEquals(typeof client.ctcp, "function");
  assertEquals(typeof client.invite, "function");
  assertEquals(typeof client.join, "function");
  assertEquals(typeof client.kick, "function");
  assertEquals(typeof client.kill, "function");
  assertEquals(typeof client.motd, "function");
  assertEquals(typeof client.privmsg, "function");
  assertEquals(typeof client.msg, "function");
  assertEquals(typeof client.nick, "function");
  assertEquals(typeof client.notice, "function");
  assertEquals(typeof client.oper, "function");
  assertEquals(typeof client.part, "function");
  assertEquals(typeof client.ping, "function");
  assertEquals(typeof client.quit, "function");
  assertEquals(typeof client.time, "function");
  assertEquals(typeof client.topic, "function");
  assertEquals(typeof client.version, "function");
  assertEquals(typeof client.whois, "function");
});

Deno.test("client events", async () => {
  const client = new Client({ nick: "nick" });

  const listeners =
    (client as unknown as { listeners: EventEmitter<Events>["listeners"] })
      .listeners;

  assertEquals(listeners.ctcp_action?.length, undefined);
  assertEquals(listeners.ctcp_clientinfo?.length, 1);
  assertEquals(listeners.ctcp_clientinfo_reply?.length, undefined);
  assertEquals(listeners["raw:ctcp"]?.length, 5);
  assertEquals(listeners.invite?.length, undefined);
  assertEquals(listeners.join?.length, undefined);
  assertEquals(listeners.kick?.length, undefined);
  assertEquals(listeners.kill?.length, undefined);
  assertEquals(listeners.motd?.length, undefined);
  assertEquals(listeners.privmsg?.length, undefined);
  assertEquals(listeners["privmsg:channel"]?.length, undefined);
  assertEquals(listeners["privmsg:private"]?.length, undefined);
  assertEquals(listeners.nick?.length, 1);
  assertEquals(listeners.notice?.length, undefined);
  assertEquals(listeners.part?.length, undefined);
  assertEquals(listeners.ping?.length, 1);
  assertEquals(listeners.pong?.length, undefined);
  assertEquals(listeners.ctcp_ping?.length, 1);
  assertEquals(listeners.ctcp_ping_reply?.length, undefined);
  assertEquals(listeners.quit?.length, undefined);
  assertEquals(listeners.register?.length, 1);
  assertEquals(listeners.myinfo?.length, 1);
  assertEquals(listeners.ctcp_time?.length, 1);
  assertEquals(listeners.ctcp_time_reply?.length, undefined);
  assertEquals(listeners.topic_change?.length, undefined);
  assertEquals(listeners.topic_set?.length, undefined);
  assertEquals(listeners.topic_set_by?.length, undefined);
  assertEquals(listeners.ctcp_version?.length, 1);
  assertEquals(listeners.whois_reply?.length, undefined);
});

Deno.test("client state", async () => {
  const client = new Client({ nick: "nick" });

  assertEquals(client.state.nick, "nick");
  assertEquals(client.state.serverHost, "");
  assertEquals(client.state.serverVersion, "");
  assertEquals(client.state.availableUserModes, []);
  assertEquals(client.state.availableChannelModes, []);
});

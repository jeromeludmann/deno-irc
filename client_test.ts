import { Client, ClientOptions } from "./client.ts";
import { assertArrayIncludes, assertEquals, assertExists } from "./deps.ts";
import { describe } from "./testing/helpers.ts";
import { MockClient } from "./testing/client.ts";
import { MockServer } from "./testing/server.ts";
import { mockConsole } from "./testing/console.ts";

describe("client", (test) => {
  const options: Required<ClientOptions> = {
    maxListeners: 50,
    bufferSize: 512,
    password: "password",
    nick: "me",
    username: "user",
    realname: "real name",
    channels: ["#channel1", "#channel2"],
    oper: { user: "oper", pass: "pass" },
    joinOnInvite: true,
    ctcpReplies: {
      clientinfo: true,
      ping: true,
      time: true,
      version: "deno-irc",
    },
    resolveInvalidNames: true,
    verbose: true,
    reconnect: false,
  };

  let client: MockClient;
  let server: MockServer;
  let raw: string[] = [];

  test("can be instantiated", () => {
    client = new MockClient(options);
    server = new MockServer(client);
    mockConsole();

    assertEquals(client instanceof Client, true);
  });

  test("have core commands", () => {
    assertExists(client.connect);
    assertExists(client.send);
    assertExists(client.disconnect);
    assertExists(client.emit);
    assertExists(client.on);
    assertExists(client.once);
    assertExists(client.wait);
    assertExists(client.off);
    assertExists(client.count);
  });

  test("have plugin commands", () => {
    assertExists(client.action);
    assertExists(client.clientinfo);
    assertExists(client.ctcp);
    assertExists(client.invite);
    assertExists(client.join);
    assertExists(client.kick);
    assertExists(client.kill);
    assertExists(client.motd);
    assertExists(client.privmsg);
    assertExists(client.nick);
    assertExists(client.notice);
    assertExists(client.oper);
    assertExists(client.part);
    assertExists(client.ping);
    assertExists(client.quit);
    assertExists(client.time);
    assertExists(client.topic);
    assertExists(client.version);
    assertExists(client.whois);
  });

  test("have plugin command aliases", () => {
    assertEquals(client.action, client.me);
    assertEquals(client.privmsg, client.msg);
  });

  test("have state initialized", () => {
    assertEquals(client.state, {
      remoteAddr: { hostname: "", port: 0, tls: false },
      nick: "me",
      username: "user",
      realname: "real name",
      serverHost: "",
      serverVersion: "",
      availableUserModes: [],
      availableChannelModes: [],
    });
  });

  test("connect to server", async () => {
    const conn = await client.connect("host");

    assertExists(conn);
    assertEquals(client.state.remoteAddr, {
      hostname: "host",
      port: 6667,
      tls: false,
    });
  });

  test("register on connect", () => {
    raw = server.receive();

    assertEquals(raw, [
      "PASS password",
      "NICK me",
      "USER user 0 * :real name",
    ]);
  });

  test("reply to PING", async () => {
    server.send("PING :key");
    await client.once("ping");
    raw = server.receive();

    assertEquals(raw, ["PONG key"]);
  });

  test("be registered on RPL_WELCOME", async () => {
    server.send(":serverhost 001 me :Welcome to the server");
    const msg = await client.once("register");

    assertExists(msg);

    raw = server.receive(); // for the two next tests
  });

  test("join channels on RPL_WELCOME", () => {
    assertArrayIncludes(raw, ["JOIN #channel1,#channel2"]);
  });

  test("set as operator on RPL_WELCOME", () => {
    assertArrayIncludes(raw, ["OPER oper pass"]);
  });

  test("join a channel on INVITE", async () => {
    server.send(":someone!user@host INVITE me :#new_channel");
    await client.once("invite");
    raw = server.receive();

    assertEquals(raw, ["JOIN #new_channel"]);
  });

  test("send PRIVMSG to channel", () => {
    client.privmsg("#channel", "Hello world!");
    raw = server.receive();

    assertEquals(raw, ["PRIVMSG #channel :Hello world!"]);
  });

  test("leave a channel on KICK", async () => {
    server.send(":someone!user@host KICK #channel me");
    const msg = await client.once("kick");

    assertEquals(msg, {
      channel: "#channel",
      comment: undefined,
      nick: "me",
      origin: {
        nick: "someone",
        userhost: "host",
        username: "user",
      },
    });
  });

  test("be disconnected on connection close", async () => {
    server.shutdown();
    const msg = await client.once("disconnected");

    assertExists(msg);
  });
});

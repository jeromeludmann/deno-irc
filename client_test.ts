import { type ClientOptions } from "./client.ts";
import { assertArrayIncludes, assertEquals, assertExists } from "./deps.ts";
import { describe } from "./testing/helpers.ts";
import { MockClient } from "./testing/client.ts";
import { MockServer } from "./testing/server.ts";
import { mockConsole } from "./testing/console.ts";
import { getDefaults } from "./plugins/isupport.ts";

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

  test("should globally work with all loaded plugins", async () => {
    // should have state initialized

    const client = new MockClient(options);
    const server = new MockServer(client);
    mockConsole();

    let raw: string[] = [];
    let msg = null;

    assertEquals(client.state, {
      remoteAddr: { hostname: "", port: 0, tls: false },
      user: { nick: "me", username: "user", realname: "real name" },
      supported: getDefaults(),
      nicklists: {},
    });

    // should connect to server

    const conn = await client.connect("host");

    assertExists(conn);
    assertEquals(client.state.remoteAddr, {
      hostname: "host",
      port: 6667,
      tls: false,
    });

    // should register on connect

    raw = server.receive();

    assertEquals(raw, [
      "PASS password",
      "NICK me",
      "USER user 0 * :real name",
    ]);

    // should reply to PING

    server.send("PING :key");
    await client.once("ping");
    raw = server.receive();

    assertEquals(raw, ["PONG key"]);

    // should be registered on RPL_WELCOME

    server.send(":serverhost 001 me :Welcome to the server");
    msg = await client.once("register");

    assertExists(msg);

    // should join channels and set as operator on RPL_WELCOME

    raw = server.receive(); // for the two next assertions

    assertArrayIncludes(raw, ["JOIN #channel1,#channel2"]);
    assertArrayIncludes(raw, ["OPER oper pass"]);

    // should set supported modes

    server.send(
      ":serverhost 004 me serverhost IRC-version ilosw Obklnoquv bkloveqjfI",
    );
    msg = await client.once("myinfo");

    assertEquals(client.state.supported.modes.user, {
      "i": { type: "d" },
      "l": { type: "d" },
      "o": { type: "d" },
      "s": { type: "d" },
      "w": { type: "d" },
    });

    assertEquals(client.state.supported.modes.channel, {
      "O": { type: "b" },
      "b": { type: "a" },
      "k": { type: "b" },
      "l": { type: "c" },
      "n": { type: "d" },
      "q": { type: "d" },
      "u": { type: "d" },
      "o": { type: "b", prefix: "@" },
      "v": { type: "b", prefix: "+" },
    });

    // should override supported user modes

    server.send(
      ":serverhost 005 nick USERMODES=,,s,ilow :are supported by this server",
    );
    await client.once("raw");

    assertEquals(client.state.supported.modes.user, {
      "i": { type: "d" },
      "l": { type: "d" },
      "o": { type: "d" },
      "s": { type: "c" },
      "w": { type: "d" },
    });

    // should override supported channel modes

    server.send(
      ":serverhost 005 nick CHANMODES=b,k,l,Onu :are supported by this server",
    );
    await client.once("raw");

    assertEquals(client.state.supported.modes.channel, {
      "O": { type: "d" },
      "b": { type: "a" },
      "k": { type: "b" },
      "l": { type: "c" },
      "n": { type: "d" },
      "q": { type: "d" },
      "u": { type: "d" },
      "o": { type: "b", prefix: "@" },
      "v": { type: "b", prefix: "+" },
    });

    // should override supported channel modes

    server.send(
      ":serverhost 005 nick PREFIX=(qov)~@+ :are supported by this server",
    );
    await client.once("raw");

    assertEquals(client.state.supported.modes.channel, {
      "O": { type: "d" },
      "b": { type: "a" },
      "k": { type: "b" },
      "l": { type: "c" },
      "n": { type: "d" },
      "u": { type: "d" },
      "q": { type: "b", prefix: "~" },
      "o": { type: "b", prefix: "@" },
      "v": { type: "b", prefix: "+" },
    });

    // should join a channel on INVITE

    server.send(":someone!user@host INVITE me :#channel");
    await client.once("invite");
    raw = server.receive();

    assertEquals(raw, ["JOIN #channel"]);

    // should set nicklist

    server.send(":me!user@host JOIN #channel");
    await client.once("nicklist");

    assertEquals(client.state.nicklists["#channel"], [
      { prefix: "", nick: "me" },
    ]);

    server.send([
      ":serverhost 353 me = #channel :me +nick1 +nick2 nick4",
      ":serverhost 353 me = #channel :~@+nick3 +nick5 @+nick6",
      ":serverhost 366 me #channel :End of /NAMES list",
    ]);
    await client.once("nicklist");

    assertEquals(client.state.nicklists["#channel"], [
      { prefix: "~", nick: "nick3" },
      { prefix: "@", nick: "nick6" },
      { prefix: "+", nick: "nick1" },
      { prefix: "+", nick: "nick2" },
      { prefix: "+", nick: "nick5" },
      { prefix: "", nick: "me" },
      { prefix: "", nick: "nick4" },
    ]);

    // should update nicklist on user channel modes

    server.send(":nick6!user@host MODE #channel +v me");
    msg = await client.once("nicklist");

    assertEquals(msg.nicklist, [
      { prefix: "~", nick: "nick3" },
      { prefix: "@", nick: "nick6" },
      { prefix: "+", nick: "me" },
      { prefix: "+", nick: "nick1" },
      { prefix: "+", nick: "nick2" },
      { prefix: "+", nick: "nick5" },
      { prefix: "", nick: "nick4" },
    ]);

    server.send(":nick3!user@host MODE #channel +o me");
    msg = await client.once("nicklist");

    assertEquals(msg.nicklist, [
      { prefix: "~", nick: "nick3" },
      { prefix: "@", nick: "me" },
      { prefix: "@", nick: "nick6" },
      { prefix: "+", nick: "nick1" },
      { prefix: "+", nick: "nick2" },
      { prefix: "+", nick: "nick5" },
      { prefix: "", nick: "nick4" },
    ]);

    server.send(":nick3!user@host MODE #channel -o me");
    msg = await client.once("nicklist");

    assertEquals(msg.nicklist, [
      { prefix: "~", nick: "nick3" },
      { prefix: "@", nick: "nick6" },
      { prefix: "+", nick: "me" },
      { prefix: "+", nick: "nick1" },
      { prefix: "+", nick: "nick2" },
      { prefix: "+", nick: "nick5" },
      { prefix: "", nick: "nick4" },
    ]);

    // should send PRIVMSG to channel

    client.privmsg("#channel", "Hello world!");
    raw = server.receive();

    assertEquals(raw, ["PRIVMSG #channel :Hello world!"]);

    // should update nicklist on KICK

    server.send(":nick6!user@host KICK #channel nick2");
    await client.once("kick");
    server.send(":nick6!user@host KICK #channel nick5");
    await client.once("kick");
    server.send(":nick6!user@host KICK #channel nick2");
    await client.once("kick");

    assertEquals(client.state.nicklists["#channel"], [
      { prefix: "~", nick: "nick3" },
      { prefix: "@", nick: "nick6" },
      { prefix: "+", nick: "me" },
      { prefix: "+", nick: "nick1" },
      { prefix: "", nick: "nick4" },
    ]);

    // should be kicked

    server.send(":nick3!user@host KICK #channel me");
    msg = await client.once("nicklist");

    assertEquals("#channel" in client.state.nicklists, false);
    assertEquals(msg.nicklist, []);

    // should be disconnected on connection close

    server.shutdown();
    msg = await client.once("disconnected");

    assertExists(msg);
  });
});

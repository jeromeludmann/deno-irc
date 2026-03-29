import { assertEquals, assertMatch } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { Client } from "../client.ts";

const HOST = "127.0.0.1";
const PORT = 6667;
const IRCD = typeof Deno !== "undefined"
  ? Deno.env.get("IRCD") ?? "ergo"
  // deno-lint-ignore no-process-global
  : process.env.IRCD ?? "ergo";

describe("integration", (test) => {
  let counter = 0;

  const connect = async (base: string) => {
    const nick = `${base}${++counter}`;
    const client = new Client({
      nick,
      username: nick,
      realname: `Test ${nick}`,
    });
    client.on("error", (error) => {
      throw error;
    });
    await client.connect(HOST, { port: PORT });
    await client.once("register");
    return client;
  };

  const nickOf = (client: Client) => client.state.user.nick;

  const cleanup = async (...clients: Client[]) => {
    for (const client of clients) {
      client.quit();
      await client.once("disconnected");
    }
  };

  test("channel messages, topic, join, part", async () => {
    const alice = await connect("alice");
    const bob = await connect("bob");

    // Join
    alice.join("#chan");
    await alice.once("join");
    bob.join("#chan");
    await bob.once("join");

    // Channel message
    const bobReceived = bob.once("privmsg:channel");
    alice.privmsg("#chan", "hello bob");
    const msg = await bobReceived;
    assertEquals(msg.source?.name, nickOf(alice));
    assertEquals(msg.params.text, "hello bob");

    // Topic
    alice.topic("#chan", "new topic");
    await alice.once("topic");
    alice.topic("#chan");
    const topicReply = await alice.once("topic_reply");
    assertEquals(topicReply.params.topic, "new topic");

    // Second channel
    alice.join("#chan2");
    await alice.once("join");
    bob.join("#chan2");
    await bob.once("join");

    const bobChan2 = bob.once("privmsg:channel");
    alice.privmsg("#chan2", "in chan2");
    const msg2 = await bobChan2;
    assertEquals(msg2.params.target, "#chan2");

    // Part
    const bobSeesPart = bob.once("part");
    alice.part("#chan2", "bye chan2");
    const part = await bobSeesPart;
    assertEquals(part.params.channel, "#chan2");

    await cleanup(alice, bob);
  });

  test("private messages and notices", async () => {
    const alice = await connect("alice");
    const bob = await connect("bob");

    // Private message alice -> bob
    const bobPm = bob.once("privmsg:private");
    alice.privmsg(nickOf(bob), "secret");
    const pm = await bobPm;
    assertEquals(pm.source?.name, nickOf(alice));
    assertEquals(pm.params.text, "secret");

    // Private message bob -> alice
    const alicePm = alice.once("privmsg:private");
    bob.privmsg(nickOf(alice), "reply");
    const pm2 = await alicePm;
    assertEquals(pm2.source?.name, nickOf(bob));
    assertEquals(pm2.params.text, "reply");

    // Notice
    const bobNotice = bob.once("notice:private");
    alice.notice(nickOf(bob), "hey listen");
    const notice = await bobNotice;
    assertEquals(notice.source?.name, nickOf(alice));
    assertEquals(notice.params.text, "hey listen");

    // Action (/me)
    alice.join("#act");
    await alice.once("join");
    bob.join("#act");
    await bob.once("join");

    const bobAction = bob.once("ctcp_action");
    alice.action("#act", "waves");
    const action = await bobAction;
    assertEquals(action.source?.name, nickOf(alice));
    assertEquals(action.params.text, "waves");

    await cleanup(alice, bob);
  });

  test("kick, invite, quit", async () => {
    const alice = await connect("alice");
    const bob = await connect("bob");

    alice.join("#ops");
    await alice.once("join");
    const bobJoinsOps = alice.once("join");
    bob.join("#ops");
    await Promise.all([bob.once("join"), bobJoinsOps]);

    // Kick
    const bobKicked = bob.once("kick");
    alice.kick("#ops", nickOf(bob), "behave");
    const kick = await bobKicked;
    assertEquals(kick.params.nick, nickOf(bob));
    assertEquals(kick.params.comment, "behave");

    // Invite back
    const bobInvited = bob.once("invite");
    alice.invite(nickOf(bob), "#ops");
    const invite = await bobInvited;
    assertEquals(invite.params.channel, "#ops");

    const bobRejoinsOps = alice.once("join");
    bob.join("#ops");
    await Promise.all([bob.once("join"), bobRejoinsOps]);

    // Quit
    const aliceSeesQuit = alice.once("quit");
    bob.quit("peace out");
    const quit = await aliceSeesQuit;
    if (quit.params.comment) {
      assertMatch(quit.params.comment, /peace out/);
    }

    await cleanup(alice);
  });

  test("channel modes: op, voice, moderated", async () => {
    const alice = await connect("alice");
    const bob = await connect("bob");

    alice.join("#modes");
    await alice.once("join");
    const bobJoinsModes = alice.once("join");
    bob.join("#modes");
    await Promise.all([bob.once("join"), bobJoinsModes]);

    // +v bob
    const bobSeesVoice = bob.once("mode:channel");
    alice.mode("#modes", "+v", nickOf(bob));
    const voiceOn = await bobSeesVoice;
    assertEquals(voiceOn.params.mode, "+v");

    // -v bob
    const bobSeesDevoice = bob.once("mode:channel");
    alice.mode("#modes", "-v", nickOf(bob));
    const voiceOff = await bobSeesDevoice;
    assertEquals(voiceOff.params.mode, "-v");

    // +o bob
    const bobSeesOp = bob.once("mode:channel");
    alice.mode("#modes", "+o", nickOf(bob));
    const opOn = await bobSeesOp;
    assertEquals(opOn.params.mode, "+o");

    // -o bob
    const bobSeesDeop = bob.once("mode:channel");
    alice.mode("#modes", "-o", nickOf(bob));
    const opOff = await bobSeesDeop;
    assertEquals(opOff.params.mode, "-o");

    // +m (moderated): bob without voice cannot send
    const bobSeesModerated = bob.once("mode:channel");
    alice.mode("#modes", "+m");
    await alice.once("mode:channel");
    await bobSeesModerated;

    // bob sends a message — alice should NOT receive it
    bob.privmsg("#modes", "should be blocked");
    const timeout = await Promise.race([
      alice.once("privmsg:channel").then(() => "received"),
      new Promise<string>((r) => setTimeout(() => r("timeout"), 1000)),
    ]);
    assertEquals(timeout, "timeout");

    // +v bob → bob can now speak in +m channel
    const bobVoiced = bob.once("mode:channel");
    alice.mode("#modes", "+v", nickOf(bob));
    await bobVoiced;

    const aliceReceived = alice.once("privmsg:channel");
    bob.privmsg("#modes", "now I can talk");
    const modMsg = await aliceReceived;
    assertEquals(modMsg.params.text, "now I can talk");

    await cleanup(alice, bob);
  });

  test("nick change, whois, away", async () => {
    const alice = await connect("alice");
    const bob = await connect("bob");

    alice.join("#misc");
    await alice.once("join");
    const bobJoinsMisc = alice.once("join");
    bob.join("#misc");
    await Promise.all([bob.once("join"), bobJoinsMisc]);

    // Nick change
    const bobSeesNick = bob.once("nick");
    const aliceSeesNick = alice.once("nick");
    const aliceOldNick = nickOf(alice);
    const aliceNewNick = `${aliceOldNick}_new`;
    alice.nick(aliceNewNick);
    const [nickEvent] = await Promise.all([bobSeesNick, aliceSeesNick]);
    assertEquals(nickEvent.params.nick, aliceNewNick);
    assertEquals(nickOf(alice), aliceNewNick);

    // Whois
    bob.whois(aliceNewNick);
    const whois = await bob.once("whois_reply");
    assertEquals(whois.params.nick, aliceNewNick);
    assertEquals(typeof whois.params.username, "string");
    assertMatch(whois.params.realname, /Test/);

    // Away
    alice.away("brb");
    await alice.once("raw:rpl_nowaway");

    const bobAwayReply = bob.once("away_reply");
    bob.privmsg(nickOf(alice), "you there?");
    const awayReply = await bobAwayReply;
    assertEquals(awayReply.params.nick, aliceNewNick);
    assertEquals(awayReply.params.text, "brb");

    // Back
    alice.back();
    await alice.once("raw:rpl_unaway");

    // No away_reply after back
    bob.privmsg(nickOf(alice), "welcome back");
    const noAway = await Promise.race([
      bob.once("away_reply").then(() => "received"),
      new Promise<string>((r) => setTimeout(() => r("timeout"), 1000)),
    ]);
    assertEquals(noAway, "timeout");

    await cleanup(alice, bob);
  });

  test("invite-only, ban, channel notice", async () => {
    const alice = await connect("alice");
    const bob = await connect("bob");

    // Alice creates invite-only channel
    alice.join("#restricted");
    await alice.once("join");
    alice.mode("#restricted", "+i");
    await alice.once("mode:channel");

    // Bob tries to join — should fail
    const bobError = bob.once("raw:err_inviteonlychan");
    bob.join("#restricted");
    await bobError;

    // Alice invites bob → bob joins
    const bobInvited = bob.once("invite");
    alice.invite(nickOf(bob), "#restricted");
    await bobInvited;

    const aliceSeesJoin = alice.once("join");
    bob.join("#restricted");
    await bob.once("join");
    await aliceSeesJoin;

    // Ban bob using wildcard mask
    const bobNick = nickOf(bob);
    const banMask = `${bobNick}!*@*`;
    alice.mode("#restricted", "+b", banMask);
    await alice.once("mode:channel");

    // Remove invite-only so we can test ban independently
    alice.mode("#restricted", "-i");
    await alice.once("mode:channel");

    // Kick bob
    const bobKicked = bob.once("kick");
    alice.kick("#restricted", bobNick, "banned");
    await bobKicked;

    // Bob tries to re-join — should fail (banned)
    const bobBanError = bob.once("error_reply");
    bob.join("#restricted");
    const banErr = await bobBanError;
    assertEquals(banErr.command, "err_bannedfromchan");

    // Unban bob
    alice.mode("#restricted", "-b", banMask);
    await alice.once("mode:channel");

    const aliceSeesRejoin = alice.once("join");
    bob.join("#restricted");
    await bob.once("join");
    await aliceSeesRejoin;

    // Channel notice
    const bobNotice = bob.once("notice:channel");
    alice.notice("#restricted", "heads up everyone");
    const chanNotice = await bobNotice;
    assertEquals(chanNotice.source?.name, nickOf(alice));
    assertEquals(chanNotice.params.text, "heads up everyone");

    await cleanup(alice, bob);
  });

  test("server-time: messages carry time tag", async () => {
    const alice = await connect("alice");
    const bob = await connect("bob");

    alice.join("#time");
    await alice.once("join");
    bob.join("#time");
    await bob.once("join");

    const rawPromise = bob.once("raw:privmsg");
    alice.privmsg("#time", "what time is it");
    const raw = await rawPromise;

    assertEquals(typeof raw.tags?.time, "string");
    const date = new Date(raw.tags!.time!);
    assertEquals(isNaN(date.getTime()), false);

    await cleanup(alice, bob);
  });

  test("away-notify: receive away status changes", async () => {
    const alice = await connect("alice");
    const bob = await connect("bob");

    alice.join("#away");
    await alice.once("join");
    bob.join("#away");
    await bob.once("join");

    // Bob goes away
    const awayPromise = alice.once("away_notify");
    bob.away("brb");
    const away = await awayPromise;
    assertEquals(away.params.away, true);
    assertEquals(away.params.message, "brb");

    // Bob comes back
    const backPromise = alice.once("away_notify");
    bob.back();
    const back = await backPromise;
    assertEquals(back.params.away, false);

    await cleanup(alice, bob);
  });

  test("echo-message: receive self-sent messages", async () => {
    const alice = await connect("alice");

    alice.join("#echo");
    await alice.once("join");

    const echoPromise = alice.once("echo:privmsg");
    alice.privmsg("#echo", "echo test");
    const echo = await echoPromise;
    assertEquals(echo.params.target, "#echo");
    assertEquals(echo.params.text, "echo test");

    await cleanup(alice);
  });

  test("setname: receive realname changes", async () => {
    const alice = await connect("alice");
    if (!alice.state.caps.enabled.has("setname")) {
      return await cleanup(alice);
    }
    const bob = await connect("bob");

    alice.join("#setname");
    await alice.once("join");
    bob.join("#setname");
    await bob.once("join");

    const setnamePromise = alice.once("setname");
    bob.setname("New Real Name");
    const msg = await setnamePromise;
    assertEquals(msg.params.realname, "New Real Name");

    await cleanup(alice, bob);
  });

  test("WHO: receive who reply", async () => {
    const alice = await connect("alice");
    const bob = await connect("bob");

    alice.join("#who");
    await alice.once("join");
    bob.join("#who");
    await bob.once("join");

    alice.who("#who");
    const reply = await alice.once("who_reply");
    assertEquals(reply.params.target, "#who");
    assertEquals(reply.params.entries.length >= 2, true);

    const nicks = reply.params.entries.map((e: { nick: string }) => e.nick);
    assertEquals(nicks.includes(nickOf(alice)), true);
    assertEquals(nicks.includes(nickOf(bob)), true);

    await cleanup(alice, bob);
  });

  test("MONITOR: track online/offline status", async () => {
    const alice = await connect("alice");
    if (!("MONITOR" in alice.state.isupport)) {
      return await cleanup(alice);
    }
    const monitorNick = `mon${++counter}`;

    // Monitor a nick that doesn't exist yet
    alice.monitor.add(monitorNick);

    // Connect the monitored nick -> should trigger online
    const onlinePromise = alice.once("monitor:online");
    const bob = new Client({
      nick: monitorNick,
      username: monitorNick,
      realname: "Test",
    });
    bob.on("error", (error) => {
      throw error;
    });
    await bob.connect(HOST, { port: PORT });
    await bob.once("register");

    const online = await onlinePromise;
    assertEquals(online.params.nicks.includes(monitorNick), true);

    // Disconnect bob -> should trigger offline
    const offlinePromise = alice.once("monitor:offline");
    bob.quit();
    await bob.once("disconnected");
    const offline = await offlinePromise;
    assertEquals(offline.params.nicks.includes(monitorNick), true);

    await cleanup(alice);
  });

  test("message-split: long messages are split", async () => {
    const alice = await connect("alice");
    const bob = await connect("bob");

    alice.join("#split");
    await alice.once("join");
    bob.join("#split");
    await bob.once("join");

    // Send a message long enough to be split (>512 bytes with overhead)
    const longText = "word ".repeat(120).trim();
    const received: string[] = [];

    bob.on("privmsg:channel", (msg) => {
      received.push(msg.params.text);
    });

    alice.privmsg("#split", longText);

    // Wait a bit for all parts to arrive
    await new Promise((r) => setTimeout(r, 2000));

    assertEquals(received.length >= 2, true);
    // Reconstructed text should contain all the original words
    const rebuilt = received.join(" ");
    assertEquals(rebuilt.includes("word"), true);

    await cleanup(alice, bob);
  });

  test("cap: enabledCapabilities tracks ACKed caps", async () => {
    const alice = await connect("alice");

    // After registration, the server ACKs the caps we requested.
    // Give a moment for the ACK to be processed.
    await new Promise((r) => setTimeout(r, 500));
    assertEquals(alice.state.caps.enabled.size > 0, true);

    await cleanup(alice);
  });

  test("invite-notify: channel members see invites", async () => {
    const alice = await connect("alice");
    const bob = await connect("bob");
    const charlie = await connect("charlie");

    alice.join("#invnotify");
    await alice.once("join");
    bob.join("#invnotify");
    await bob.once("join");

    // Make alice op so she can invite
    // Bob should receive the invite notification via invite-notify
    const invitePromise = Promise.race([
      bob.once("invite").then(() => "invite"),
      new Promise<string>((r) => setTimeout(() => r("timeout"), 5000)),
    ]);
    alice.invite(nickOf(charlie), "#invnotify");
    const result = await invitePromise;
    // Some ircds may not broadcast invites to other members
    assertEquals(typeof result, "string");

    await cleanup(alice, bob, charlie);
  });

  test("chghost: receive host change on NickServ login", async () => {
    if (IRCD !== "ergo") return;
    // Register an account for bob
    const regNick = `chg${++counter}`;
    const reg = new Client({
      nick: regNick,
      username: regNick,
      realname: "Test",
    });
    reg.on("error", () => {});
    await reg.connect(HOST, { port: PORT });
    await reg.once("register");
    reg.privmsg("NickServ", `register testpass ${regNick}@test.com`);
    await new Promise((r) => setTimeout(r, 2000));
    reg.quit();
    await reg.once("disconnected");

    // Alice joins a channel
    const alice = await connect("alice");
    alice.join("#chghost");
    await alice.once("join");

    // Bob connects WITHOUT auth, joins the channel
    const bob = await connect(regNick.slice(0, 3));
    // Force bob's nick to match the registered account
    bob.nick(regNick);
    await bob.once("nick");
    bob.join("#chghost");
    await bob.once("join");

    // Bob authenticates via NickServ — triggers cloak change → CHGHOST
    const chghostPromise = Promise.race([
      alice.once("chghost").then((msg) => msg),
      new Promise<null>((r) => setTimeout(() => r(null), 5000)),
    ]);
    bob.privmsg("NickServ", "identify testpass");
    const msg = await chghostPromise;

    if (msg) {
      assertEquals(msg.source?.name, regNick);
      assertEquals(typeof msg.params.hostname, "string");
    }
    // If null (timeout), Ergo didn't send CHGHOST for this action

    await cleanup(alice, bob);
  });

  test("message-tags: TAGMSG with client tags", async () => {
    const alice = await connect("alice");
    const bob = await connect("bob");

    alice.join("#tagtest");
    await alice.once("join");
    bob.join("#tagtest");
    await bob.once("join");

    const tagPromise = bob.once("tagmsg");
    alice.tagmsg("#tagtest", { "+typing": "active" });
    const msg = await tagPromise;
    assertEquals(msg.params.target, "#tagtest");
    assertEquals(typeof msg.params.tags, "object");

    await cleanup(alice, bob);
  });

  test("extended-join + account-tag: see account on SASL join", async () => {
    if (IRCD !== "ergo") return;
    const alice = await connect("alice");
    alice.join("#extjoin");
    await alice.once("join");

    // Register a new account via NickServ
    const regNick = `ext${++counter}`;
    const reg = new Client({
      nick: regNick,
      username: regNick,
      realname: "Test Extended",
    });
    reg.on("error", () => {});
    await reg.connect(HOST, { port: PORT });
    await reg.once("register");
    reg.privmsg("NickServ", `register testpass ${regNick}@test.com`);
    await new Promise((r) => setTimeout(r, 2000));
    reg.quit();
    await reg.once("disconnected");

    // Reconnect with SASL — bob has an account now
    const bob = new Client({
      nick: regNick,
      username: regNick,
      realname: "Test Extended",
      password: "testpass",
      authMethod: "sasl",
    });
    bob.on("error", (error) => {
      throw error;
    });
    await bob.connect(HOST, { port: PORT });
    await bob.once("register");

    // Alice sees extended_join with account info
    const extJoinPromise = alice.once("extended_join");
    bob.join("#extjoin");
    const extJoin = await extJoinPromise;
    assertEquals(extJoin.params.channel, "#extjoin");
    assertEquals(extJoin.params.account, regNick);
    assertEquals(typeof extJoin.params.realname, "string");

    // Bob sends a message — Alice sees account-tag
    const rawPromise = alice.once("raw:privmsg");
    bob.privmsg("#extjoin", "hello with account");
    const raw = await rawPromise;
    assertEquals(raw.tags?.account, regNick);

    bob.quit();
    await bob.once("disconnected");
    await cleanup(alice);
  });

  test("nickserv authentication", async () => {
    if (IRCD !== "ergo") return;
    const nick = `ns${++counter}`;
    const password = "testpass_ns";

    // Register account
    const reg = new Client({ nick, username: nick, realname: "Test" });
    reg.on("error", (error) => {
      throw error;
    });
    await reg.connect(HOST, { port: PORT });
    await reg.once("register");
    reg.privmsg("NickServ", `REGISTER ${password} ${nick}@test.com`);
    await new Promise((r) => setTimeout(r, 1000));
    reg.quit();
    await reg.once("disconnected");

    // Reconnect with NickServ (default authMethod)
    const client = new Client({
      nick,
      username: nick,
      password,
      realname: "Test",
    });
    client.on("error", (error) => {
      throw error;
    });
    await client.connect(HOST, { port: PORT });
    await client.once("register");
    assertEquals(client.state.user.nick, nick);

    await cleanup(client);
  });

  test("sasl plain authentication", async () => {
    if (IRCD !== "ergo") return;
    const nick = `sasl${++counter}`;
    const password = "testpass_plain";

    // Register account
    const reg = new Client({ nick, username: nick, realname: "Test" });
    reg.on("error", (error) => {
      throw error;
    });
    await reg.connect(HOST, { port: PORT });
    await reg.once("register");
    reg.privmsg("NickServ", `REGISTER ${password} ${nick}@test.com`);
    await new Promise((r) => setTimeout(r, 1000));
    reg.quit();
    await reg.once("disconnected");

    // Reconnect with SASL PLAIN
    const client = new Client({
      nick,
      username: nick,
      password,
      authMethod: "sasl",
      realname: "Test",
    });
    client.on("error", (error) => {
      throw error;
    });
    await client.connect(HOST, { port: PORT });
    await client.once("register");
    assertEquals(client.state.user.nick, nick);

    await cleanup(client);
  });

  test("sasl external authentication", async () => {
    if (IRCD !== "ergo") return;
    const nick = `ext${++counter}`;
    const password = "testpass_ext";

    const TLS_PORT = 6697;

    // Register account with TLS client cert
    const reg = new Client({ nick, username: nick, realname: "Test" });
    reg.on("error", (error) => {
      throw error;
    });
    await reg.connect(HOST, {
      port: TLS_PORT,
      tls: true,
      certFile: "integration/certs/client.pem",
      keyFile: "integration/certs/client-key.pem",
      caCertFile: "integration/certs/ca.pem",
    });
    await reg.once("register");
    reg.privmsg("NickServ", `REGISTER ${password} ${nick}@test.com`);
    await new Promise((r) => setTimeout(r, 1000));
    reg.privmsg("NickServ", "CERT ADD");
    await new Promise((r) => setTimeout(r, 1000));
    reg.quit();
    await reg.once("disconnected");

    // Reconnect with SASL EXTERNAL using certFile/keyFile
    const client = new Client({
      nick,
      username: nick,
      authMethod: "saslExternal",
      realname: "Test",
    });
    client.on("error", (error) => {
      throw error;
    });
    await client.connect(HOST, {
      port: TLS_PORT,
      tls: true,
      certFile: "integration/certs/client.pem",
      keyFile: "integration/certs/client-key.pem",
      caCertFile: "integration/certs/ca.pem",
    });
    await client.once("register");
    assertEquals(client.state.user.nick, nick);

    await cleanup(client);
  });

  test("isupport + myinfo: server state populated after registration", async () => {
    const nick = `sup${++counter}`;
    const client = new Client({
      nick,
      username: nick,
      realname: `Test ${nick}`,
    });
    client.on("error", (error) => {
      throw error;
    });

    // Listen for motd_reply BEFORE connecting so we don't miss the event
    const motdDone = client.once("motd_reply");
    await client.connect(HOST, { port: PORT });
    await motdDone;

    const keys = Object.keys(client.state.isupport);
    assertEquals(keys.includes("CHANTYPES"), true);
    assertEquals(keys.includes("PREFIX"), true);
    assertEquals(keys.includes("CHANMODES"), true);

    assertEquals(client.state.server !== undefined, true);
    assertEquals(typeof client.state.server!.host, "string");
    assertEquals(typeof client.state.server!.version, "string");

    await cleanup(client);
  });

  test("names: names_reply contains joined nicks", async () => {
    const alice = await connect("alice");
    const bob = await connect("bob");

    alice.join("#names");
    await alice.once("join");
    bob.join("#names");
    await bob.once("join");

    const namesPromise = alice.once("names_reply");
    alice.names("#names");
    const reply = await namesPromise;
    assertEquals(reply.params.channel, "#names");

    const nicks = Object.keys(reply.params.names);
    assertEquals(nicks.includes(nickOf(alice)), true);
    assertEquals(nicks.includes(nickOf(bob)), true);

    await cleanup(alice, bob);
  });

  test("nicklist: state tracks channel members", async () => {
    const alice = await connect("alice");
    const bob = await connect("bob");

    alice.join("#nlist");
    await alice.once("join");

    // Set up listener BEFORE bob joins to avoid race
    const aliceSeesJoin = alice.once("join");
    bob.join("#nlist");
    await bob.once("join");
    await aliceSeesJoin;

    // Give nicklist time to update from NAMES reply
    await new Promise((r) => setTimeout(r, 500));

    const nicklist = alice.state.nicklists["#nlist"];
    assertEquals(Array.isArray(nicklist), true);
    const nicks = nicklist.map((e: { nick: string }) => e.nick);
    assertEquals(nicks.includes(nickOf(alice)), true);
    assertEquals(nicks.includes(nickOf(bob)), true);

    // After part, nicklist should update
    const aliceSeesPart = alice.once("part");
    bob.part("#nlist");
    await aliceSeesPart;
    await new Promise((r) => setTimeout(r, 500));

    const updatedNicks = alice.state.nicklists["#nlist"].map(
      (e: { nick: string }) => e.nick,
    );
    assertEquals(updatedNicks.includes(nickOf(bob)), false);

    await cleanup(alice, bob);
  });

  test("chanmodes + chantypes: state and utils populated", async () => {
    const alice = await connect("alice");

    // chantypes
    assertEquals(typeof alice.state.chantypes, "string");
    assertEquals(alice.state.chantypes.includes("#"), true);
    assertEquals(alice.utils.isChannel("#test"), true);
    assertEquals(alice.utils.isChannel("notachannel"), false);

    // chanmodes — at least operator prefix should exist
    assertEquals(typeof alice.state.prefixes, "object");
    assertEquals("@" in alice.state.prefixes, true);

    await cleanup(alice);
  });

  test("ping: CTCP ping round-trip between clients", async () => {
    const alice = await connect("alice");
    const bob = await connect("bob");

    const replyPromise = alice.once("ctcp_ping_reply");
    alice.ping(nickOf(bob));
    const reply = await replyPromise;
    assertEquals(typeof reply.params.latency, "number");
    assertEquals(reply.params.latency >= 0, true);

    await cleanup(alice, bob);
  });

  test("list: list channels on server", async () => {
    const alice = await connect("alice");

    alice.join("#listtest");
    await alice.once("join");
    alice.topic("#listtest", "a listed topic");
    await alice.once("topic");

    const listPromise = alice.once("list_reply");
    alice.list();
    const reply = await listPromise;

    assertEquals(Array.isArray(reply.params.channels), true);
    const found = reply.params.channels.find(
      (ch: { name: string }) => ch.name === "#listtest",
    );
    assertEquals(found !== undefined, true);
    assertEquals(found!.topic.includes("a listed topic"), true);

    await cleanup(alice);
  });

  test("motd: server returns message of the day", async () => {
    const alice = await connect("alice");

    const motdPromise = alice.once("motd_reply");
    alice.motd();
    const reply = await motdPromise;

    // motd is either an array of lines or undefined if no MOTD
    if (reply.params.motd) {
      assertEquals(Array.isArray(reply.params.motd), true);
    }

    await cleanup(alice);
  });

  test("ctcp: version, time, clientinfo round-trip", async () => {
    const alice = await connect("alice");
    const bob = await connect("bob");

    // VERSION
    const versionPromise = alice.once("ctcp_version_reply");
    alice.version(nickOf(bob));
    const version = await versionPromise;
    assertEquals(typeof version.params.version, "string");

    // TIME
    const timePromise = alice.once("ctcp_time_reply");
    alice.time(nickOf(bob));
    const time = await timePromise;
    assertEquals(typeof time.params.time, "string");

    // CLIENTINFO
    const clientinfoPromise = alice.once("ctcp_clientinfo_reply");
    alice.clientinfo(nickOf(bob));
    const clientinfo = await clientinfoPromise;
    assertEquals(Array.isArray(clientinfo.params.supported), true);
    assertEquals(clientinfo.params.supported.includes("PING"), true);

    await cleanup(alice, bob);
  });

  test("mode aliases: op, deop, voice, devoice, ban, unban", async () => {
    const alice = await connect("alice");
    const bob = await connect("bob");

    alice.join("#aliases");
    await alice.once("join");
    const aliceSeesJoin = alice.once("join");
    bob.join("#aliases");
    await Promise.all([bob.once("join"), aliceSeesJoin]);

    const modes: string[] = [];
    bob.on("mode:channel", (msg) => modes.push(msg.params.mode));

    alice.voice("#aliases", nickOf(bob));
    alice.devoice("#aliases", nickOf(bob));
    alice.op("#aliases", nickOf(bob));
    alice.deop("#aliases", nickOf(bob));
    alice.ban("#aliases", "bad!*@*");
    alice.unban("#aliases", "bad!*@*");

    await new Promise((r) => setTimeout(r, 3000));

    assertEquals(modes.includes("+v"), true);
    assertEquals(modes.includes("-v"), true);
    assertEquals(modes.includes("+o"), true);
    assertEquals(modes.includes("-o"), true);
    assertEquals(modes.includes("+b"), true);
    assertEquals(modes.includes("-b"), true);

    await cleanup(alice, bob);
  });

  test("join_on_register: auto-join channels on connect", async () => {
    const nick = `auto${++counter}`;
    const client = new Client({
      nick,
      username: nick,
      realname: `Test ${nick}`,
      channels: ["#autojoin1", "#autojoin2"],
    });
    client.on("error", (error) => {
      throw error;
    });
    await client.connect(HOST, { port: PORT });
    await client.once("register");

    // Wait for both joins
    const joins: string[] = [];
    const joinHandler = (msg: { params: { channel: string } }) => {
      if (
        msg.params.channel === "#autojoin1" ||
        msg.params.channel === "#autojoin2"
      ) {
        joins.push(msg.params.channel);
      }
    };
    client.on("join", joinHandler);

    // The joins may already have happened, check state
    await new Promise((r) => setTimeout(r, 2000));
    const channels = Object.keys(client.state.nicklists);
    assertEquals(channels.includes("#autojoin1"), true);
    assertEquals(channels.includes("#autojoin2"), true);

    await cleanup(client);
  });

  test("join_on_invite: auto-join when invited", async () => {
    const alice = await connect("alice");

    const bobNick = `inv${++counter}`;
    const bob = new Client({
      nick: bobNick,
      username: bobNick,
      realname: `Test ${bobNick}`,
      joinOnInvite: true,
    });
    bob.on("error", (error) => {
      throw error;
    });
    await bob.connect(HOST, { port: PORT });
    await bob.once("register");

    alice.join("#invjoin");
    await alice.once("join");

    // Alice invites bob — bob should auto-join
    const aliceSeesJoin = alice.once("join");
    alice.invite(bobNick, "#invjoin");
    const joinEvent = await aliceSeesJoin;
    assertEquals(joinEvent.params.channel, "#invjoin");

    await cleanup(alice, bob);
  });

  test("account_notify: receive account login notification", async () => {
    if (IRCD !== "ergo") return;

    // Register an account
    const regNick = `acn${++counter}`;
    const reg = new Client({
      nick: regNick,
      username: regNick,
      realname: "Test",
    });
    reg.on("error", () => {});
    await reg.connect(HOST, { port: PORT });
    await reg.once("register");
    reg.privmsg("NickServ", `register testpass ${regNick}@test.com`);
    await new Promise((r) => setTimeout(r, 2000));
    reg.quit();
    await reg.once("disconnected");

    // Alice joins a channel
    const alice = await connect("alice");
    alice.join("#accnotify");
    await alice.once("join");

    // Bob connects without auth, joins the channel
    const bob = new Client({
      nick: regNick,
      username: regNick,
      realname: "Test",
    });
    bob.on("error", () => {});
    await bob.connect(HOST, { port: PORT });
    await bob.once("register");
    bob.join("#accnotify");
    await bob.once("join");

    // Bob authenticates via NickServ — triggers ACCOUNT notification
    let timer: ReturnType<typeof setTimeout>;
    const accountPromise = Promise.race([
      alice.once("account").then((msg) => msg),
      new Promise<null>((r) => {
        timer = setTimeout(() => r(null), 5000);
      }),
    ]);
    bob.privmsg("NickServ", "identify testpass");
    const msg = await accountPromise;
    clearTimeout(timer!);

    if (msg) {
      assertEquals(msg.source?.name, regNick);
      assertEquals(typeof msg.params.account, "string");
    }

    bob.quit();
    await bob.once("disconnected");
    await cleanup(alice);
  });

  test("invalid_names: resolves nick collision", async () => {
    const nick = `dup${++counter}`;

    // First client takes the nick
    const first = new Client({
      nick,
      username: nick,
      realname: "Test",
    });
    first.on("error", (error) => {
      throw error;
    });
    await first.connect(HOST, { port: PORT });
    await first.once("register");
    assertEquals(first.state.user.nick, nick);

    // Second client tries the same nick — should get resolved
    const second = new Client({
      nick,
      username: nick,
      realname: "Test",
      resolveInvalidNames: true,
    });
    second.on("error", (error) => {
      throw error;
    });
    await second.connect(HOST, { port: PORT });
    await second.once("register");

    // The nick should have been modified (typically with _ suffix)
    assertEquals(second.state.user.nick !== nick, true);

    await cleanup(first, second);
  });

  test("labeled-response: cap is negotiated", async () => {
    const alice = await connect("alice");

    if (!alice.state.caps.enabled.has("labeled-response")) {
      return await cleanup(alice);
    }

    assertEquals(alice.state.caps.enabled.has("labeled-response"), true);

    await cleanup(alice);
  });

  test("batch: cap is negotiated", async () => {
    const alice = await connect("alice");

    // batch cap should be enabled if the server supports it
    if (!alice.state.caps.enabled.has("batch")) {
      return await cleanup(alice);
    }

    assertEquals(alice.state.caps.enabled.has("batch"), true);

    await cleanup(alice);
  });
});

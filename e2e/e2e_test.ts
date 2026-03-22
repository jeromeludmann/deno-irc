import { assertEquals, assertMatch } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { Client } from "../client.ts";

const HOST = "127.0.0.1";
const PORT = 6667;

describe("e2e", (test) => {
  let counter = 0;

  const connect = async (base: string) => {
    const nick = `${base}${++counter}`;
    const client = new Client({
      nick,
      username: nick,
      realname: `E2E ${nick}`,
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
    assertMatch(quit.params.comment!, /peace out/);

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
    assertMatch(whois.params.realname, /E2E/);

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
    const bobError = bob.once("error_reply");
    bob.join("#restricted");
    const err = await bobError;
    assertEquals(err.command, "err_inviteonlychan");

    // Alice invites bob → bob joins
    const bobInvited = bob.once("invite");
    alice.invite(nickOf(bob), "#restricted");
    await bobInvited;

    const aliceSeesJoin = alice.once("join");
    bob.join("#restricted");
    await bob.once("join");
    await aliceSeesJoin;

    // Ban bob using wildcard mask (Ergo uses cloaked hosts)
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

  test("nickserv authentication", async () => {
    const nick = `ns${++counter}`;
    const password = "testpass_ns";

    // Register account
    const reg = new Client({ nick, username: nick, realname: "E2E" });
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
      realname: "E2E",
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
    const nick = `sasl${++counter}`;
    const password = "testpass_plain";

    // Register account
    const reg = new Client({ nick, username: nick, realname: "E2E" });
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
      realname: "E2E",
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
    const nick = `ext${++counter}`;
    const password = "testpass_ext";

    const TLS_PORT = 6697;

    // Register account with TLS client cert
    const reg = new Client({ nick, username: nick, realname: "E2E" });
    reg.on("error", (error) => {
      throw error;
    });
    await reg.connect(HOST, {
      port: TLS_PORT,
      tls: true,
      certFile: "e2e/certs/client.pem",
      keyFile: "e2e/certs/client-key.pem",
      caCertFile: "e2e/certs/ca.pem",
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
      realname: "E2E",
    });
    client.on("error", (error) => {
      throw error;
    });
    await client.connect(HOST, {
      port: TLS_PORT,
      tls: true,
      certFile: "e2e/certs/client.pem",
      keyFile: "e2e/certs/client-key.pem",
      caCertFile: "e2e/certs/ca.pem",
    });
    await client.once("register");
    assertEquals(client.state.user.nick, nick);

    await cleanup(client);
  });
});

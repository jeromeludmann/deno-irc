# API Reference

- [Options](#options)
  - [option: authMethod](#option-authmethod)
  - [option: bot](#option-bot)
  - [option: bufferSize](#option-buffersize)
  - [option: channels](#option-channels)
  - [option: ctcpReplies](#option-ctcpreplies)
  - [option: floodDelay](#option-flooddelay)
  - [option: joinOnInvite](#option-joinoninvite)
  - [option: maxListeners](#option-maxlisteners)
  - [option: messageSplit](#option-messagesplit)
  - [option: nick](#option-nick)
  - [option: oper](#option-oper)
  - [option: password](#option-password)
  - [option: pingTimeout](#option-pingtimeout)
  - [option: realname](#option-realname)
  - [option: reconnect](#option-reconnect)
  - [option: resolveInvalidNames](#option-resolveinvalidnames)
  - [option: saslTimeout](#option-sasltimeout)
  - [option: serverPassword](#option-serverpassword)
  - [option: username](#option-username)
  - [option: verbose](#option-verbose)
- [Events](#events)
  - [event: account](#event-account)
  - [event: batch_start](#event-batch_start)
  - [event: batch_end](#event-batch_end)
  - [event: away_notify](#event-away_notify)
  - [event: away_reply](#event-away_reply)
  - [event: connecting](#event-connecting)
  - [event: connected](#event-connected)
  - [event: ctcp_action](#event-ctcp_action)
  - [event: ctcp_clientinfo](#event-ctcp_clientinfo)
  - [event: ctcp_time](#event-ctcp_time)
  - [event: ctcp_time_reply](#event-ctcp_time_reply)
  - [event: ctcp_ping](#event-ctcp_ping)
  - [event: ctcp_ping_reply](#event-ctcp_ping_reply)
  - [event: ctcp_version](#event-ctcp_version)
  - [event: ctcp_version_reply](#event-ctcp_version_reply)
  - [event: dcc_accept](#event-dcc_accept)
  - [event: dcc_accept_reply](#event-dcc_accept_reply)
  - [event: dcc_chat](#event-dcc_chat)
  - [event: dcc_chat_reply](#event-dcc_chat_reply)
  - [event: dcc_resume](#event-dcc_resume)
  - [event: dcc_resume_reply](#event-dcc_resume_reply)
  - [event: dcc_send](#event-dcc_send)
  - [event: dcc_send_reply](#event-dcc_send_reply)
  - [event: cap:ack](#event-capack)
  - [event: cap:nak](#event-capnak)
  - [event: cap:new](#event-capnew)
  - [event: cap:del](#event-capdel)
  - [event: chghost](#event-chghost)
  - [event: disconnected](#event-disconnected)
  - [event: echo:privmsg](#event-echoprivmsg)
  - [event: echo:notice](#event-echonotice)
  - [event: error](#event-error)
  - [event: error_reply](#event-error_reply)
  - [event: extended_join](#event-extended_join)
  - [event: fail](#event-fail)
  - [event: invite](#event-invite)
  - [event: isupport](#event-isupport)
  - [event: join](#event-join)
  - [event: kick](#event-kick)
  - [event: kill](#event-kill)
  - [event: list_reply](#event-list_reply)
  - [event: monitor:online](#event-monitoronline)
  - [event: monitor:offline](#event-monitoroffline)
  - [event: monitor:list](#event-monitorlist)
  - [event: mode](#event-mode)
  - [event: mode_reply](#event-mode_reply)
  - [event: motd_reply](#event-motd_reply)
  - [event: myinfo](#event-myinfo)
  - [event: names_reply](#event-names_reply)
  - [event: nick](#event-nick)
  - [event: nicklist](#event-nicklist)
  - [event: note](#event-note)
  - [event: notice](#event-notice)
  - [event: part](#event-part)
  - [event: ping](#event-ping)
  - [event: privmsg](#event-privmsg)
  - [event: quit](#event-quit)
  - [event: setname](#event-setname)
  - [event: tagmsg](#event-tagmsg)
  - [event: raw](#event-raw)
  - [event: raw_ctcp](#event-raw_ctcp)
  - [event: reconnecting](#event-reconnecting)
  - [event: register](#event-register)
  - [event: topic](#event-topic)
  - [event: topic_reply](#event-topic_reply)
  - [event: topic_who_time_reply](#event-topic_who_time_reply)
  - [event: warn](#event-warn)
  - [event: who_reply](#event-who_reply)
  - [event: whois_reply](#event-whois_reply)
- [Commands](#commands)
  - [command: action](#command-action)
  - [command: away](#command-away)
  - [command: back](#command-back)
  - [command: ban](#command-ban)
  - [command: cap](#command-cap)
  - [command: clientinfo](#command-clientinfo)
  - [command: connect](#command-connect)
  - [command: ctcp](#command-ctcp)
  - [command: dehalfop](#command-dehalfop)
  - [command: devoice](#command-devoice)
  - [command: deop](#command-deop)
  - [command: disconnect](#command-disconnect)
  - [command: halfop](#command-halfop)
  - [command: invite](#command-invite)
  - [command: join](#command-join)
  - [command: kick](#command-kick)
  - [command: kill](#command-kill)
  - [command: labeled](#command-labeled)
  - [command: list](#command-list)
  - [command: me](#command-me)
  - [command: mode](#command-mode)
  - [command: monitor](#command-monitor)
  - [command: motd](#command-motd)
  - [command: msg](#command-msg)
  - [command: names](#command-names)
  - [command: nick](#command-nick)
  - [command: notice](#command-notice)
  - [command: on](#command-on)
  - [command: once](#command-once)
  - [command: op](#command-op)
  - [command: oper](#command-oper)
  - [command: part](#command-part)
  - [command: pass](#command-pass)
  - [command: ping](#command-ping)
  - [command: privmsg](#command-privmsg)
  - [command: quit](#command-quit)
  - [command: send](#command-send)
  - [command: setname](#command-setname)
  - [command: tagmsg](#command-tagmsg)
  - [command: time](#command-time)
  - [command: topic](#command-topic)
  - [command: unban](#command-unban)
  - [command: user](#command-user)
  - [command: version](#command-version)
  - [command: voice](#command-voice)
  - [command: who](#command-who)
  - [command: whois](#command-whois)

## Options

Client `options` are the object you provide when you create a new client
instance:

```ts
const options = {/* available options are described below */};

const client = new Client(options);
```

### option: authMethod

The authentication method to use. Defaults to NickServ if omitted.

- `NickServ` - Non-standard nickserv authentication. Requires `password`.
- `sasl` - SASL PLAIN auth. Requires `password`. Errors out if SASL fails.
- `saslThenNickServ` - Try SASL PLAIN, fallback to NickServ. Requires `password`.
- `saslExternal` - SASL EXTERNAL auth via TLS client certificate. Must NOT have `password`. Connection must use `{ tls: true }`.

```ts
const client = new Client({
  nick: "user", // will be used as username
  password: "password",
});
```

```ts
const client = new Client({
  nick: "user",
  username: "SaslUser",
  password: "password",
  authMethod: "sasl",
});
```

```ts
const client = new Client({
  nick: "user",
  authMethod: "saslExternal",
});

await client.connect("irc.libera.chat", {
  tls: true,
  certFile: "client.pem",
  keyFile: "client-key.pem",
});
```

### option: bot

Whether this client is a bot. When `true`, requests the `draft/bot-mode`
capability and automatically sets user mode `+B` after registration.

Defaults to `false`.

```ts
const client = new Client({ nick: "mybot", bot: true });
```

Use `client.utils.isBot(msg)` to check if a message was sent by a bot:

```ts
client.on("raw:privmsg", (msg) => {
  if (client.utils.isBot(msg)) {
    // message was sent by a bot
  }
});
```

### option: bufferSize

Size of the buffer that receives data from server.

Default to `4096` bytes.

```ts
const client = new Client({
  bufferSize: 512,
});
```

### option: channels

Channels to join on connect.

Joins `#channel` once registered:

```ts
const client = new Client({
  channels: [
    "#channel",
  ],
});
```

Joins `#channel1` and `#channel2` once registered:

```ts
const client = new Client({
  channels: [
    "#channel1",
    "#channel2",
  ],
});
```

Joins `#channel` with `secret_key` once registered:

```ts
const client = new Client({
  channels: [
    ["#channel", "secret_key"],
  ],
});
```

Joins `#channel1` (without key) and `#channel2` with `secret_key` once
registered:

```ts
const client = new Client({
  channels: [
    "#channel1",
    ["#channel2", "channel_key"],
  ],
});
```

### option: ctcpReplies

Replies to CTCP queries.

Default values set to:

```ts
const client = new Client({
  ctcpReplies: {
    clientinfo: true,
    ping: true,
    time: true,
    version: "my-irc-bot",
  },
});
```

Disables replies to CTCP PING and VERSION queries:

```ts
const client = new Client({
  ctcpReplies: {
    ping: false,
    version: false,
  },
});
```

Changes the version replied to CTCP VERSION:

```ts
const client = new Client({
  ctcpReplies: {
    version: "custom version name",
  },
});
```

### option: floodDelay

Milliseconds to wait between dispatching private messages.

Defaults to 0 milliseconds (no delay).

```ts
const client = new Client({
  floodDelay: 2000,
});
```

### option: joinOnInvite

Enables auto join on invite.

```ts
const client = new Client({
  joinOnInvite: true,
});
```

### option: maxListeners

Number of maximum registrable listeners.

Primarily used to avoid memory leaks.

Default limit to `1000` listeners for each event.

```ts
const client = new Client({
  maxListeners: 100,
});
```

### option: messageSplit

Enable or disable automatic splitting of long messages. Defaults to `true`.

When enabled, `PRIVMSG` and `NOTICE` messages exceeding the IRC line limit are
automatically split at word boundaries.

```ts
const client = new Client({
  messageSplit: false, // disable auto-splitting
});
```

### option: nick

The nick used to register the client to the server. Will be reused as username
for auth if no username is supplied.

```ts
const client = new Client({
  nick: "Deno",
});
```

### option: oper

Sets as operator on connect.

```ts
const client = new Client({
  oper: {
    user: "deno",
    pass: "secret",
  },
});
```

### option: password

The password for the user account associated with the username field.

```ts
const client = new Client({
  password: "secret",
});
```

### option: pingTimeout

Maximum timeout before to be disconnected from server.

Default to `30` seconds. `false` to disable.

```ts
const client = new Client({
  pingTimeout: 120,
});
```

### option: realname

The realname used to register the client to the server.

```ts
const client = new Client({
  realname: "Deno IRC",
});
```

### option: reconnect

Enables auto reconnect.

Takes a boolean or `{ attempts?: number, delay?: number, exponentialBackoff?: boolean }`.

Default to `false` or `{ attempts: 10, delay: 5 }` if set to `true`.

Tries to reconnect `10` times with a delay of `5` seconds between each attempt:

```ts
const client = new Client({
  reconnect: true,
});
```

Tries to reconnect `3` times with a delay of `10` seconds between each attempt:

```ts
const client = new Client({
  reconnect: {
    attempts: 3,
    delay: 10,
  },
});
```

Tries to reconnect `5` times with an initial delay of `3` seconds with an exponential backoff:

```ts
const client = new Client({
  reconnect: {
    attempts: 5,
    delay: 3,
    exponentialBackoff: true,
  },
});
```

### option: resolveInvalidNames

Auto resolve invalid names (for nick and username).

```ts
const client = new Client({
  resolveInvalidNames: true,
});
```

### option: saslTimeout

Timeout in seconds for SASL authentication. If the server does not respond
within this delay, SASL is treated as failed.

Default to `15`. `false` to disable.

```ts
const client = new Client({
  nick: "user",
  password: "password",
  authMethod: "sasl",
  saslTimeout: 30,
});
```

### option: serverPassword

```ts
const client = new Client({
  serverPassword: "password",
});
```

An optional server password that will be sent via the PASS command.

### option: username

The username used to register the client to the server.

```ts
const client = new Client({
  username: "deno",
});
```

### option: verbose

Prints informations to output.

Prints received and sent raw IRC messages:

```ts
const client = new Client({
  verbose: "raw",
});
```

Prints formatted events, commands and state changes:

```ts
const client = new Client({
  verbose: "formatted",
});
```

Uses a custom logger implementation:

```ts
const client = new Client({
  verbose: (payload) => {
    // use payload type for inference
    if (payload.type === "raw_input") {
      console.log(payload.msg);
    }
  },
});
```

## Events

Events are simple messages which are emitted from the client instance.

They can be received by listening to their event names.

Client can subscribe to them using two distinct ways, [`client.on`](#command-on)
and [`client.once`](#command-once):

```ts
// The first allows to add a listener for a given event:
client.on("event_name", (eventPayload) => {});

// The second is used to add a one-time listener:
const eventPayload = await client.once("event_name");

// For both methods, you can subscribe to several events at the same time:
client.on(["event1", "event2", "event3"], (eventPayload) => {
  // but doing that requires to properly infer
  // the final type of the event payload.
});
```

Event payloads are the emitted objects of events and can contain
[`source`](#event-payload-source) and [`params`](#event-payload-params).

```ts
client.on("event_name", (msg) => {
  msg.source; // event payload source
  msg.params; // event payload params
});
```

Most of payloads contain `source` and provides information about the sender of
the message.

If the `source` is provided, it always contains a `name` containing the server
host or the nick name.

```ts
client.on("event_name", (msg) => {
  if (msg.source) {
    msg.source.name; // server host or nick name
  }
});
```

In case of `source` comes from user, it can also contain `mask` (if provided by
the server):

```ts
client.on("event_name", (msg) => {
  if (msg.source?.mask) {
    msg.source.mask.user; // user name
    msg.source.mask.host; // user host
  }
});
```

Event payloads have a `params` object that contains parameters related to the
event.

The shape of `msg.params` depends on the provided event name:

```ts
client.on("event_name", (msg) => {
  msg.params; // array of event parameters
});
```

See event details below to learn more about event params.

### event: account

Emitted when a user's account changes. Requires `account-notify` IRCv3 cap.

```ts
client.on("account", (msg) => {
  msg.source?.name; // nick of the user
  msg.params.account; // account name, or "*" if logged out
});
```

The `account-tag` IRCv3 cap adds an `account` tag to all messages from
authenticated users. Use `client.utils.getAccount(msg)` to extract it:

```ts
client.on("raw:privmsg", (msg) => {
  const account = client.utils.getAccount(msg); // account name or undefined
});
```

### event: away_notify

Emitted when a user's away status changes in a shared channel. Requires
`away-notify` IRCv3 cap.

```ts
client.on("away_notify", (msg) => {
  msg.source?.name; // nick of the user
  msg.params.away; // true if away, false if back
  msg.params.message; // away message (undefined if back)
});
```

### event: away_reply

User replies with an away message.

```ts
client.on("away_reply", (msg) => {
  msg.params.nick; // nick of the client who is away
  msg.params.text; // text of away message
});
```

### event: batch_start

Emitted when a batch opens. Requires `batch` IRCv3 cap.

```ts
client.on("batch_start", (msg) => {
  msg.params.ref; // server-assigned batch reference
  msg.params.type; // batch type (e.g. "chathistory", "netsplit")
  msg.params.params; // additional parameters
});
```

### event: batch_end

Emitted when a batch closes. Contains all messages collected during the batch.
Requires `batch` IRCv3 cap.

Messages inside a batch are suppressed from normal `raw:*` event emission
and delivered together in `batch_end`.

```ts
client.on("batch_end", (msg) => {
  msg.params.ref; // batch reference
  msg.params.type; // batch type
  msg.params.messages; // all collected Raw messages
  msg.params.tags; // tags from the opening BATCH line
});
```

### event: connecting

Client is connecting to the server.

```ts
client.on("connecting", (remoteAddr) => {
  remoteAddr; // address of the server
});
```

### event: connected

Client is connected to the server.

```ts
client.on("connected", (remoteAddr) => {
  remoteAddr; // address of the server
});
```

### event: ctcp_action

User sends an action.

```ts
client.on("ctcp_action", (msg) => {
  msg.params.target; // target of the CTCP ACTION
  msg.params.text; // text of the CTCP ACTION
});
```

### event: ctcp_clientinfo

User queries a CTCP CLIENTINFO to a target.

```ts
client.on("ctcp_clientinfo", (msg) => {
  msg.params.target; // target of the CTCP CLIENTINFO query
});
```

### event: ctcp_clientinfo_reply

User replies to a CTCP CLIENTINFO.

```ts
client.on("ctcp_clientinfo_reply", (msg) => {
  msg.params.supported; // array of supported commands by the user
});
```

### event: ctcp_time

User queries a CTCP TIME to a target.

```ts
client.on("ctcp_time", (msg) => {
  msg.params.target; // target of the CTCP TIME query
});
```

### event: ctcp_time_reply

User replies to a CTCP TIME.

```ts
client.on("ctcp_time_reply", (msg) => {
  msg.params.time; // date time of the user
});
```

### event: ctcp_ping

User pings the client.

```ts
client.on("ctcp_ping", (msg) => {
  msg.params.target; // target of the CTCP PING query
  msg.params.key; // key of the CTCP PING query
});
```

### event: ctcp_ping_reply

User replies to the CTCP PING to the client.

```ts
client.on("ctcp_ping_reply", (msg) => {
  msg.params.key; // key of the CTCP PING repl
  msg.params.latency; // latency (in milliseconds)
});
```

### event: ctcp_version

User queries a CTCP VERSION to a target.

```ts
client.on("ctcp_version", (msg) => {
  msg.params.target; // Target of the CTCP VERSION query
});
```

### event: ctcp_version_reply

User replies to a CTCP VERSION.

```ts
client.on("ctcp_version_reply", (msg) => {
  msg.params.version; // client version of the user
});
```

### event: dcc_accept

User accepts a `DCC RESUME`.

```ts
client.on("dcc_accept", (msg) => {
  msg.params.text; // original DCC payload string
  msg.params.filename; // string
  msg.params.port; // number (0 if passive)
  msg.params.position; // number (byte offset)
  msg.params.token; // number | undefined
  msg.params.passive; // boolean
});
```

### event: dcc_chat

User requests starting a direct chat session.
`SCHAT` is normalized here with `tls: true`.

```ts
client.on("dcc_chat", (msg) => {
  msg.params.text; // original DCC payload string
  msg.params.ip; // { type: "ipv4"|"ipv6"|"hostname"; value: string }
  msg.params.port; // number (0 if passive)
  msg.params.token; // number | undefined
  msg.params.passive; // boolean
  msg.params.tls; // boolean (true if SCHAT, else false)
});
```

### event: dcc_resume

User requests resuming a file transfer.

```ts
client.on("dcc_resume", (msg) => {
  // common
  msg.params.action; // "resume"
  msg.params.text; // original DCC payload string

  // payload
  msg.params.filename; // string
  msg.params.port; // number (0 if passive)
  msg.params.position; // number (byte offset)
  msg.params.token; // number | undefined
  msg.params.passive; // boolean
});
```

### event: dcc_send

User offers sending a file.

```ts
client.on("dcc_send", (msg) => {
  msg.params.source; // { name: "nickname"; mask: { user: "string"; host: "string" } }
  msg.params.text; // original DCC payload string
  msg.params.filename; // string
  msg.params.ip; // { type: "ipv4"|"ipv6"|"hostname"; value: string }
  msg.params.port; // number (0 if passive)
  msg.params.size; // number (bytes)
  msg.params.token; // number | undefined
  msg.params.passive; // boolean
});
```

### event: cap:ack

Emitted when the server acknowledges requested capabilities.

```ts
client.on("cap:ack", (msg) => {
  msg.params.caps; // array of acknowledged capability names
});
```

### event: cap:nak

Emitted when the server rejects requested capabilities.

```ts
client.on("cap:nak", (msg) => {
  msg.params.caps; // array of rejected capability names
});
```

### event: cap:new

Emitted when the server advertises new capabilities. Requires `cap-notify`.

```ts
client.on("cap:new", (msg) => {
  msg.params.caps; // array of newly available capability names
});
```

### event: cap:del

Emitted when the server removes capabilities. Requires `cap-notify`.

```ts
client.on("cap:del", (msg) => {
  msg.params.caps; // array of removed capability names
});
```

### event: chghost

Emitted when a user's host or ident changes. Requires `chghost` IRCv3 cap.

```ts
client.on("chghost", (msg) => {
  msg.source?.name; // nick of the user
  msg.params.username; // new username
  msg.params.hostname; // new hostname
});
```

### event: disconnected

Client has been disconnected from the server.

```ts
client.on("disconnected", (remoteAddr) => {
  remoteAddr; // address of the server
});
```

### event: echo:privmsg

Emitted when the server echoes back a PRIVMSG sent by the client. Requires
`echo-message` IRCv3 cap.

When `echo-message` is active, self-sent messages do not trigger `privmsg`
events. Use `echo:privmsg` to handle them instead.

```ts
client.on("echo:privmsg", (msg) => {
  msg.params.target; // target of the echoed message
  msg.params.text; // text of the echoed message
});
```

### event: echo:notice

Emitted when the server echoes back a NOTICE sent by the client. Requires
`echo-message` IRCv3 cap.

```ts
client.on("echo:notice", (msg) => {
  msg.params.target; // target of the echoed notice
  msg.params.text; // text of the echoed notice
});
```

You can also check if any raw message is a self-echo with
`client.utils.isEcho(msg)`:

```ts
client.on("raw:privmsg", (msg) => {
  if (client.utils.isEcho(msg)) {
    // this message was sent by us
  }
});
```

### event: error

Client emits a fatal error.

```ts
client.on("error", (error) => {
  error.name; // name describing the error
  error.message; // message describing the error
  error.type; // type of the error
});
```

When an error is emitted, it will be thrown by default and causes a crash of the
program.

To avoid the client from crashing, **it is required to have at least one event
listener for the `"error"` event name**.

By listening to the `"error"` event, errors will no longer be thrown:

```ts
client.on("error", console.error);
```

Even better, you can handle them by checking `error.type` property:

```ts
client.on("error", (error) => {
  switch (error.type) {
    case "connect": {
      // errors while connecting
    }
    case "read": {
      // errors while receiving messages from server
    }
    case "write": {
      // errors while sending messages to server
    }
    case "close": {
      // errors while closing connection
    }
  }
});
```

This behavior is heavily inspired by the
[Node.js error handling](https://www.joyent.com/node-js/production/design/errors).

An early crash prevents loosing useful informations when the client tries
something without success.

### event: error_reply

Server sends an error to the client.

```ts
client.on("error_reply", (msg) => {
  msg.params.args; // arguments of the error
  msg.params.text; // description of the error
});
```

### event: extended_join

Emitted when a user joins with extended information. Requires `extended-join`
IRCv3 cap. The normal `join` event is also emitted.

```ts
client.on("extended_join", (msg) => {
  msg.source?.name; // nick of the user
  msg.params.channel; // channel name
  msg.params.account; // account name, or "*" if not logged in
  msg.params.realname; // real name
});
```

### event: fail

Emitted when the server sends a FAIL standard reply. No capability needed.

```ts
client.on("fail", (msg) => {
  msg.params.command; // related command (e.g. "CHATHISTORY")
  msg.params.code; // machine-readable code (e.g. "ACCOUNT_REQUIRED")
  msg.params.context; // additional context strings (may be empty)
  msg.params.description; // human-readable description
});
```

### event: invite

User invites the client to a channel.

```ts
client.on("invite", (msg) => {
  msg.params.nick; // nick who was invited
  msg.params.channel; // channel where the nick was invited
});
```

### event: isupport

Server sends ISUPPORT parameter to the client.

Supported events:

- `isupport:usermodes`
- `isupport:chanmodes`
- `isupport:prefix`
- `isupport:chantypes`

```ts
client.on("isupport:chanmodes", (msg) => {
  msg.params.value; // value of the current ISUPPORT parameter
});
```

### event: join

User joins a channel.

```ts
client.on("join", (msg) => {
  msg.params.channel; // channel joined by the user
});
```

### event: kick

User kicks another user.

```ts
client.on("kick", (msg) => {
  msg.params.channel; // channel where the nick is kicked
  msg.params.nick; // nick who is kicked
  msg.params.comment; // optional comment of the kick
});
```

### event: kill

User kills another user.

```ts
client.on("kill", (msg) => {
  msg.params.nick; // nick who is killed
  msg.params.comment; // comment of the kill
});
```

### event: list_reply

Server sends all channel list.

```ts
client.on("list_reply", (msg) => {
  msg.params.channels; // the entire channel list

  for (const channel of msg.params.channels) {
    channel.name; // name of the channel
    channel.count; // client count
    channel.topic; // topic of this channel
  }
});
```

### event: monitor:online

Emitted when monitored nicks come online.

```ts
client.on("monitor:online", (msg) => {
  msg.params.nicks; // array of nicks that are now online
});
```

### event: monitor:offline

Emitted when monitored nicks go offline.

```ts
client.on("monitor:offline", (msg) => {
  msg.params.nicks; // array of nicks that are now offline
});
```

### event: monitor:list

Emitted with the full list of currently monitored nicks.

```ts
client.on("monitor:list", (msg) => {
  msg.params.nicks; // array of monitored nicks
});
```

### event: mode

Server changes a user mode or a channel mode.

```ts
client.on("mode", (msg) => {
  msg.params.target; // target of the MODE, can be either a channel or a nick
});
```

You can only listen for user modes or channel modes:

```ts
client.on("mode:user", (msg) => {/* only user modes */});

client.on("mode:channel", (msg) => {/* only channel modes */});
```

### event: mode_reply

Server replies to a MODE query.

```ts
client.on("mode_reply", (msg) => {
  msg.params.target; // target of the MODE, can be either a channel or a nick
  msg.params.modes; // all the modes currently set
});
```

You can only listen for user mode replies or channel mode replies:

```ts
client.on("mode_reply:user", (msg) => {/* only user mode replies */});

client.on("mode_reply:channel", (msg) => {/* only channel mode replies */});
```

### event: motd_reply

Server sends the message of the day.

```ts
client.on("motd_reply", (msg) => {
  msg.params.motd; // message of the day (MOTD)
});
```

### event: myinfo

Server sends informations related to the server configuration.

```ts
client.on("myinfo", (msg) => {
  msg.params.server; // server informations
  msg.params.usermodes; // server user modes
  msg.params.chanmodes; // server channel modes
});
```

### event: names_reply

Server sends the names list of a channel.

```ts
client.on("names_reply", (msg) => {
  msg.params.channel; // name of the channel
  msg.params.names; // nicknames joined to this channel
});
```

For a ready to use nicklist, see [`nicklist`](#event-nicklist).

When `userhost-in-names` IRCv3 cap is enabled, `client.state.userhosts`
contains the user/host masks for each nick per channel:

```ts
client.on("names_reply", (msg) => {
  const hosts = client.state.userhosts[msg.params.channel];
  for (const [nick, mask] of Object.entries(hosts ?? {})) {
    mask.user; // username
    mask.host; // hostname
  }
});
```

### event: nick

User changes its nick.

```ts
client.on("nick", (msg) => {
  msg.params.nick; // new nick used by the user
});
```

### event: nicklist

Server sends a updated nicklist of a channel.

```ts
client.on("nicklist", (msg) => {
  msg.params.channel; // name of the channel
  msg.params.nicklist; // nicknames joined to this channel

  for (const user of msg.params.nicklist) {
    user.prefix; // prefix of the user
    user.nick; // nick of the user
  }
});
```

### event: note

Emitted when the server sends a NOTE standard reply. No capability needed.
Same structure as [`fail`](#event-fail).

```ts
client.on("note", (msg) => {
  msg.params.command;
  msg.params.code;
  msg.params.context;
  msg.params.description;
});
```

### event: notice

Server or user notifies a target.

```ts
client.on("notice", (msg) => {
  msg.params.target; // target of the NOTICE, can be either a channel or a nick
  msg.params.text; // text of the NOTICE
});
```

You can only listen for channel notices or private notices:

```ts
client.on("notice:channel", (msg) => {/* only channel notices */});

client.on("notice:private", (msg) => {/* only private notices */});
```

### event: part

User leaves a channel.

```ts
client.on("part", (msg) => {
  msg.params.channel; // channel left by the user
  msg.params.comment; // optional comment of the PART
});
```

### event: ping

Server pings the client.

```ts
client.on("ping", (msg) => {
  msg.params.keys; // keys of the PING
});
```

### event: pong

Server replies to PING to the client.

```ts
client.on("pong", (msg) => {
  msg.params.daemon; // daemon of the PONG
  msg.params.key; // key of the PONG
  msg.params.latency; // latency (in milliseconds)
});
```

### event: privmsg

User sends a message to a channel or client.

```ts
client.on("privmsg", (msg) => {
  msg.params.target; // target of the PRIVMSG, can be either a channel or a nick
  msg.params.text; // text of the PRIVMSG
});
```

You can only listen for channel messages or private messages:

```ts
client.on("privmsg:channel", (msg) => {/* only channel messages */});

client.on("privmsg:private", (msg) => {/* only private messages */});
```

### event: quit

User leaves the server.

```ts
client.on("quit", (msg) => {
  msg.params.comment; // optional comment of the QUIT
});
```

### event: setname

Emitted when a user changes their real name. Requires `setname` IRCv3 cap.

```ts
client.on("setname", (msg) => {
  msg.source?.name; // nick of the user
  msg.params.realname; // new real name
});
```

### event: tagmsg

Emitted when a TAGMSG (tags-only message) is received. Requires `message-tags`
IRCv3 cap. Can be filtered with `tagmsg:channel` and `tagmsg:private`.

```ts
client.on("tagmsg", (msg) => {
  msg.params.target; // target of the TAGMSG
  msg.params.tags; // tags attached to the message
});
```

The `server-time` IRCv3 cap adds a `time` tag to all messages. Use
`client.utils.getServerTime(msg)` to parse it:

```ts
client.on("raw:privmsg", (msg) => {
  const time = client.utils.getServerTime(msg); // Date or null
});
```

### event: who_reply

Emitted when the full WHO reply for a target has been received.

```ts
client.on("who_reply", (msg) => {
  msg.params.target; // target of the WHO query
  msg.params.entries; // array of WHO entries
  // each entry: { channel, username, host, server, nick, flags, hopcount, realname }
});
```

### event: raw

Client sends a raw message.

```ts
client.on("raw", (raw) => {
  raw.source; // origin of the raw message
  raw.command; // raw command
  raw.params; // raw parameters
});
```

You can target any raw commands with `"raw:*"` pattern:

```ts
client.on("raw:join", (msg) => {
  // JOIN message
});

// similar to
client.on("raw", (msg) => {
  if (msg.command === "join") {
    // JOIN message
  }
});
```

### event: raw_ctcp

#### Raw CTCP Query

User sends a CTCP to a target.

Supported query events:

- `raw_ctcp:action` (favor [`ctcp_action`](#event-ctcp_action) instead)
- `raw_ctcp:clientinfo` (favor [`ctcp_clientinfo`](#event-ctcp_clientinfo)
  instead)
- `raw_ctcp:ping` (favor [`ctcp_ping`](#event-ctcp_ping) instead)
- `raw_ctcp:time` (favor [`ctcp_time`](#event-ctcp_time) instead)
- `raw_ctcp:version` (favor [`ctcp_version`](#event-ctcp_version) instead)

```ts
client.on("raw_ctcp:ping", (msg) => {
  msg.params.supported; // name of the CTCP command
});
```

#### Raw CTCP Reply

User replies to a CTCP.

Supported reply events:

- `raw_ctcp:clientinfo_reply` (favor
  [`ctcp_clientinfo_reply`](#event-ctcp_clientinfo_reply) instead)
- `raw_ctcp:ping_reply` (favor [`ctcp_ping_reply`](#event-ctcp_ping_reply)
  instead)
- `raw_ctcp:time_reply` (favor [`ctcp_time_reply`](#event-ctcp_time_reply)
  instead)
- `raw_ctcp:version_reply` (favor
  [`ctcp_version_reply`](#event-ctcp_version_reply) instead)

```ts
client.on("raw_ctcp:ping_reply", (msg) => {
  msg.params.supported; // name of the CTCP command
});
```

### event: reconnecting

Client tries to reconnect to the server.

```ts
client.on("reconnecting", (remoteAddr) => {
  remoteAddr; // address of the server
});
```

### event: register

Server confirms that the client has been registered.

This event is useful to ensures that client connection is ready to receive
commands.

```ts
client.on("register", (msg) => {
  msg.params.nick; // nick who is registered
  msg.params.text; // text of the RPL_WELCOME
});
```

### event: topic

User changes the topic of a channel.

```ts
client.on("topic", (msg) => {
  msg.params.channel; // channel where the topic is set
  msg.params.topic; // new topic of the channel
});
```

### event: topic_reply

Server replies with the topic of a channel.

```ts
client.on("topic_reply", (msg) => {
  msg.params.channel; // channel where the topic is set
  msg.params.topic; // new topic of the channel
});
```

### event: topic_who_time_reply

Server replies with the topic informations of a channel.

```ts
client.on("topic_who_time_reply", (msg) => {
  msg.params.channel; // channel where the topic is set
  msg.params.who; // user who set the topic
  msg.params.time; // date time of the topic
});
```

### event: whois_reply

Server replies to a WHOIS command.

```ts
client.on("whois_reply", (msg) => {
  msg.params.nick; // nick
  msg.params.host; // hostname
  msg.params.username; // user name
  msg.params.realname; // real name
  msg.params.channels; // channels joined
  msg.params.idle; // idle time
  msg.params.server; // server where the user is connected
  msg.params.serverinfo; // informations of the connected server
  msg.params.operator; // optional user operator message
  msg.params.away; // optional away message
});
```

### event: warn

Emitted when the server sends a WARN standard reply. No capability needed.
Same structure as [`fail`](#event-fail).

```ts
client.on("warn", (msg) => {
  msg.params.command;
  msg.params.code;
  msg.params.context;
  msg.params.description;
});
```

## Commands

Commands are the way to send messages to the server.

They can be sent by just calling them.

### command: action

Sends an action message `text` to a `target`.

`action(target: string, text: string): void`

```ts
client.action("#channel", "says hello");

client.action("someone", "says hello");
```

### command: away

To be marked as being away.

`away(text?: string): void`

```ts
client.away("I'm busy");

client.away(); // to be no longer marked as being away
```

### command: back

To be no longer marked as being away.

Same as `client.away()`.

`back(): void`

```ts
client.back(); // to be no longer marked as being away
```

### command: ban

Sets ban `mask` on `channel`.

Shortcut for [`mode`](#command-mode).

`ban(channel: string, mask: string, ...masks: string[]): void`

```ts
client.ban("#channel", "nick!user@host");

client.ban(
  "#channel",
  "nick1!user@host",
  "nick2!user@host",
  "nick3!user@host",
);
```

### command: cap

Sends a capability.

`cap: (command: AnyCapabilityCommand, ...params: string[]) => void`

```ts
client.cap("REQ", "capability");
```

### command: clientinfo

Queries the supported CTCP commands of a `target`.

`clientinfo(target: string): void`

```ts
client.clientinfo("#channel");
```

### command: connect

Connects to a server using a hostname and an optional port.

Default port to `6667`.

Resolves when connected.

`async connect(hostname: string, options?: ConnectOptions): Promise<Conn | null>`

```ts
client.connect("irc.libera.chat");

client.connect("irc.libera.chat", { port: 6697, tls: true });

// With client certificate (file paths)
client.connect("irc.libera.chat", {
  port: 6697,
  tls: true,
  certFile: "client.pem",
  keyFile: "client-key.pem",
  caCertFile: "ca.pem",
});

// Or with PEM content directly
client.connect("irc.libera.chat", {
  port: 6697,
  tls: true,
  cert: certContent,
  key: keyContent,
  caCerts: [caContent],
});
```

### command: ctcp

Sends a CTCP message to a `target` with a `command` and a `param`.

`ctcp(target: string, command: AnyRawCtcpCommand, param?: string): void`

```ts
client.ctcp("#channel", "TIME");

client.ctcp("#channel", "ACTION", "param");
```

For easier use, see also other CTCP-derived methods:

- `action`
- `clientinfo`
- `ping`
- `time`
- `version`

### command: dcc

Sends a CTCP `DCC` command to a `target`. Returns the raw IRC `PRIVMSG` line that was sent.

`dcc(target: string, cmd: DccCmd): string`

- `send`: filename, ip, port, size, [token]
- `chat`: ip, port, [token]
- `schat`: ip, port, [token] (secure; serialized as `SCHAT`)
- `resume`: filename, port, position, [token]
- `accept`: filename, port, position, [token]

```ts
// DCC CHAT
client.dcc("someone", {
  action: "chat",
  args: { ip: "203.0.113.42", port: 6000 },
});
// returns: "PRIVMSG someone :\x01DCC CHAT 203.0.113.42 6000\x01"
```

```ts
// DCC SCHAT (secure chat)
client.dcc("someone", {
  action: "schat",
  args: { ip: "[2001:db8::1]", port: 6697 },
});
// returns: "PRIVMSG someone :\x01DCC SCHAT [2001:db8::1] 6697\x01"
```

```ts
// DCC SEND with size and optional token
client.dcc("someone", {
  action: "send",
  args: {
    filename: "file.bin",
    ip: "203.0.113.10",
    port: 5000,
    size: 123456,
    token: 42,
  },
});
// returns: "PRIVMSG someone :\x01DCC SEND file.bin 203.0.113.10 5000 123456 42\x01"
```

```ts
// DCC RESUME (request resuming at byte position)
client.dcc("someone", {
  action: "resume",
  args: { filename: "file.bin", port: 5000, position: 65536 },
});
// returns: "PRIVMSG someone :\x01DCC RESUME file.bin 5000 65536\x01"
```

```ts
// DCC ACCEPT (accept resume at byte position)
client.dcc("someone", {
  action: "accept",
  args: { filename: "file.bin", port: 5000, position: 65536 },
});
// returns: "PRIVMSG someone :\x01DCC ACCEPT file.bin 5000 65536\x01"
```

### command: dehalfop

Takes half-operator from `nick` on `channel`.

Shortcut for [`mode`](#command-mode).

`dehalfop(channel: string, nick: string, ...nicks: string[]): void`

```ts
client.dehalfop("#channel", "nick");

client.dehalfop("#channel", "nick1", "nick2", "nick3");
```

### command: devoice

Takes voice from `nick` on `channel`.

Shortcut for [`mode`](#command-mode).

`devoice(channel: string, nick: string, ...nicks: string[]): void`

```ts
client.devoice("#channel", "nick");

client.devoice("#channel", "nick1", "nick2", "nick3");
```

### command: deop

Takes operator from `nick` on `channel`.

Shortcut for [`mode`](#command-mode).

`deop(channel: string, nick: string, ...nicks: string[]): void`

```ts
client.deop("#channel", "nick");

client.deop("#channel", "nick1", "nick2", "nick3");
```

### command: disconnect

Disconnects from the server.

`disconnect(): void`

```ts
client.disconnect();
```

### command: halfop

Gives half-operator to `nick` on `channel`.

Shortcut for [`mode`](#command-mode).

`halfop(channel: string, nick: string, ...nicks: string[]): void`

```ts
client.halfop("#channel", "nick");

client.halfop("#channel", "nick1", "nick2", "nick3");
```

### command: invite

Invites a `nick` to a `channel`.

`invite(nick: string, channel: string): void`

```ts
client.invite("someone", "#channel");
```

### command: join

Joins `channels` with optional keys.

`join(...params: ChannelDescriptions): void`

```ts
client.join("#channel");

client.join(["#channel", "key"]);

client.join("#channel1", "#channel2");

client.join("#channel1", ["#channel2", "key2"]);

client.join(["#channel1", "key1"], "#channel2");

client.join(["#channel1", "key1"], ["#channel2", "key2"]);

client.join(["#channel1", "key1"], "#channel2", ["#channel3", "key3"]);
```

### command: kick

Kicks a `nick` from a `channel` with an optional `comment`.

`kick(channel: string, nick: string, comment?: string): void`

```ts
client.kick("#channel", "someone");

client.kick("#channel", "someone", "Boom!");
```

### command: kill

Kills a `nick` from the server with a `comment`.

`kill(nick: string, comment: string): void`

```ts
client.kill("someone", "Boom!");
```

### command: labeled

Sends a command with an auto-generated label tag. Requires `labeled-response`
IRCv3 cap. Responses from the server carry the same label in their tags.

`labeled(command: string, ...params: string[]): void`

```ts
client.labeled("WHOIS", "nick");
// sends: @label=L1 WHOIS nick
// responses will have msg.tags.label === "L1"
```

### command: list

Gets the list channels and their topics.

Replies with [`list_reply`](#event-list_reply) event when ended.

`list(channels?: string | string[], server?: string): void`

```ts
client.list();

client.list("#chan");

client.list("#chan", "host");

client.list(["#chan1", "#chan2"]);

client.list(["#chan1", "#chan2"], "host");
```

### command: me

`me(target: string, text: string): void`

Sends an action message `text` to a `target`.

Alias of [`action`](#command-action).

```ts
client.me("#channel", "says hello");

client.me("someone", "says hello");
```

### command: mode

Manages modes.

`mode(target: string, modes?: string, ...args: string[]): void`

Gets Modes:

```ts
client.mode("nick");

client.mode("#channel");
```

Sets Modes:

```ts
client.mode("nick", "+w");

client.mode("#chan", "e");

client.mode("#chan", "+v", "nick");

client.mode("#chan", "+iko", "secret", "nick");
```

### command: monitor

Manages the MONITOR list for online presence tracking.

```ts
client.monitor.add("nick1"); // add a nick to the monitor list
client.monitor.add(["nick1", "nick2"]); // add multiple nicks
client.monitor.remove("nick1"); // remove a nick
client.monitor.list(); // request the current monitor list
client.monitor.clear(); // clear the entire monitor list
client.monitor.status(); // request online status of all monitored nicks
```

The monitor limit is available via `client.state.monitorLimit` (from ISUPPORT).
The local monitor list is tracked in `client.state.monitorList`.

### command: motd

Gets the message of the day (MOTD) of the server.

Replies with [`motd_reply`](#event-motd_reply) event when ended.

`motd(): void`

```ts
client.motd();
```

### command: msg

Sends a message `text` to a `target`.

Alias of [`privmsg`](#command-privmsg).

`msg(target: string, text: string): void`

```ts
client.msg("#channel", "Hello world");

client.msg("someone", "Hello world");
```

### command: names

Gets the nicknames joined to a channel and their prefixes.

`names(channels: string | string[]): void`

```ts
client.names("#channel");

client.names(["#channel1", "#channel2"]);
```

### command: nick

Sets the `nick` of the client (once connected).

`nick(nick: string): void`

```ts
client.nick("new_nick");
```

### command: notice

Notifies a `target` with a `text`.

`notice(target: string, text: string): void`

```ts
client.notice("#channel", "Hello world");

client.notice("someone", "Hello world");
```

### command: on

Adds a `listener` for the `eventName`.

`on(eventName: T | T[], listener: Listener<InferredPayload<TEvents, T>>): () => void`

```ts
client.on("event_name", (eventPayload) => {});
```

### command: once

Adds a one-time `listener` for the `eventName`.

`once(eventName: T | T[], listener: Listener<InferredPayload<TEvents, T>>): void`

`once(eventName: T | T[]): Promise<InferredPayload<TEvents, T>>`

```ts
const eventPayload = await client.once("event_name");
```

### command: op

Gives operator to `nick` on `channel`.

Shortcut for [`mode`](#command-mode).

`op(channel: string, nick: string, ...nicks: string[]): void`

```ts
client.op("#channel", "nick");

client.op("#channel", "nick1", "nick2", "nick3");
```

### command: oper

Sets the client as operator with a `user` and a `password`.

`oper(user: string, password: string): void`

```ts
client.oper("user", "pass");
```

### command: part

Leaves the `channel` with an optional `comment`.

`part(channel: string, comment?: string): void`

```ts
client.part("#channel");

client.part("#channel", "Goodbye!");
```

### command: pass

Sets the password of the server.

Registration only.

`pass(password: string): void`

```ts
client.pass("password");
```

### command: ping

Pings the server or a given client `target`.

`ping(target?: string): void`

Pings the server:

```ts
client.ping();
```

Pings (CTCP) all clients from `"#channel"`:

```ts
client.ping("#channel");
```

Pings (CTCP) a client `"nick"`:

```ts
client.ping("nick");
```

### command: privmsg

Sends a message `text` to a `target`.

`privmsg(target: string, text: string): void`

```ts
client.privmsg("#channel", "Hello world");

client.privmsg("someone", "Hello world");
```

### command: quit

Leaves the server with an optional `comment`.

Resolves after closing link.

`quit(comment?: string): Promise<void>`

```ts
client.quit();

client.quit("Goodbye!");
```

### command: send

Sends a raw message to the server.

Resolves with the raw message sent to the server, or `null` if nothing has been
sent.

`async send(command: AnyRawCommand, ...params: (string | undefined)[]): Promise<string | null>`

```ts
client.quit();

client.quit("Goodbye!");
```

### command: setname

Changes your real name. Requires `setname` IRCv3 cap.

`setname(realname: string): void`

```ts
client.setname("New Real Name");
```

### command: tagmsg

Sends a TAGMSG (tags-only message) to a target. Requires `message-tags` IRCv3
cap.

`tagmsg(target: string, tags?: Record<string, string | undefined>): void`

```ts
client.tagmsg("#channel", { "+typing": "active" });

client.tagmsg("#channel", { "+reply": "msgid123" });
```

### command: time

Queries the date time of a `target`.

`time(target?: string): void`

```ts
client.time();

client.time("#channel");
```

### command: topic

Manages the `topic` of a `channel`.

`topic(channel: string, topic?: string): void`

Gets the `topic` of a `channel`:

```ts
client.topic("#channel");
```

Changes the `topic` of a `channel`:

```ts
client.topic("#channel", "New topic for #channel");
```

### command: unban

Unsets ban `mask` on `channel`.

Shortcut for [`mode`](#command-mode).

`unban(channel: string, mask: string, ...masks: string[]): void`

```ts
client.unban("#channel", "nick!user@host");

client.unban(
  "#channel",
  "nick1!user@host",
  "nick2!user@host",
  "nick3!user@host",
);
```

### command: user

Sets the username and the realname.

Registration only.

`user(username: string, realname: string): void`

```ts
client.user("username", "real name");
```

### command: version

Queries the client version of a `target`.

Queries the server if `target` is not provided.

`version(target?: string): void`

```ts
client.version();

client.version("someone");
```

### command: voice

Gives voice to `nick` on `channel`.

Shortcut for [`mode`](#command-mode).

`voice(channel: string, nick: string, ...nicks: string[]): void`

```ts
client.voice("#channel", "nick");

client.voice("#channel", "nick1", "nick2", "nick3");
```

### command: who

Sends a WHO query for a target.

`who(target: string, options?: WhoOptions): void`

```ts
client.who("#channel");
```

With WHOX fields:

```ts
client.who("#channel", { fields: "nuhsra", token: "42" });
```

### command: whois

Gets the WHOIS informations of a `nick`:

`whois(nick: string): void`

```ts
client.whois("someone");
```

Gets the WHOIS informations of a `nick` for a given `server`:

`whois(server: string, nick: string): void`

```ts
client.whois("serverhost", "someone");
```

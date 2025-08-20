# API Reference

- [Options](#options)
  - [option: authMethod](#option-authmethod)
  - [option: bufferSize](#option-buffersize)
  - [option: channels](#option-channels)
  - [option: ctcpReplies](#option-ctcpreplies)
  - [option: floodDelay](#option-flooddelay)
  - [option: joinOnInvite](#option-joinoninvite)
  - [option: maxListeners](#option-maxlisteners)
  - [option: nick](#option-nick)
  - [option: oper](#option-oper)
  - [option: password](#option-password)
  - [option: pingTimeout](#option-pingtimeout)
  - [option: realname](#option-realname)
  - [option: reconnect](#option-reconnect)
  - [option: resolveInvalidNames](#option-resolveinvalidnames)
  - [option: serverPassword](#option-serverpassword)
  - [option: username](#option-username)
  - [option: verbose](#option-verbose)
- [Events](#events)
  - [event: away_reply](#event-away_reply)
  - [event: connecting](#event-connecting)
  - [event: connected](#event-connected)
  - [event: ctcp_action](#event-ctcp_action)
  - [event: ctcp_clientinfo](#event-ctcp_clientinfo)
  - [event: ctcp_time](#event-ctcp_time)
  - [event: ctcp_time](#event-ctcp_time)
  - [event: ctcp_time_reply](#event-ctcp_time_reply)
  - [event: ctcp_ping](#event-ctcp_ping)
  - [event: ctcp_ping_reply](#event-ctcp_ping_reply)
  - [event: ctcp_version](#event-ctcp_version)
  - [event: ctcp_version_reply](#event-ctcp_version_reply)
  - [event: dcc_accept](#event-dcc_acceot)
  - [event: dcc_accept_reply](#event-dcc_accept_reply)
  - [event: dcc_chat](#event-dcc_chat)
  - [event: dcc_chat_reply](#event-dcc_chat_reply)
  - [event: dcc_resume](#event-dcc_resume)
  - [event: dcc_resume_reply](#event-dcc_resume_reply)
  - [event: dcc_send](#event-dcc_send)
  - [event: dcc_send_reply](#event-dcc_send_reply)
  - [event: disconnected](#event-disconnected)
  - [event: error](#event-error)
  - [event: error_reply](#event-error_reply)
  - [event: invite](#event-invite)
  - [event: isupport](#event-isupport)
  - [event: join](#event-join)
  - [event: kick](#event-kick)
  - [event: kill](#event-kill)
  - [event: list_reply](#event-list_reply)
  - [event: mode](#event-mode)
  - [event: mode_reply](#event-mode_reply)
  - [event: motd_reply](#event-motd_reply)
  - [event: myinfo](#event-myinfo)
  - [event: names_reply](#event-names_reply)
  - [event: nick](#event-nick)
  - [event: nicklist](#event-nicklist)
  - [event: notice](#event-notice)
  - [event: part](#event-part)
  - [event: ping](#event-ping)
  - [event: privmsg](#event-privmsg)
  - [event: quit](#event-quit)
  - [event: raw](#event-raw)
  - [event: raw_ctcp](#event-raw_ctcp)
  - [event: reconnecting](#event-reconnecting)
  - [event: register](#event-register)
  - [event: topic](#event-topic)
  - [event: topic_reply](#event-topic_reply)
  - [event: topic_who_time_reply](#event-topic_who_time_reply)
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
  - [command: list](#command-list)
  - [command: me](#command-me)
  - [command: mode](#command-mode)
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
  - [command: time](#command-time)
  - [command: topic](#command-topic)
  - [command: unban](#command-unban)
  - [command: user](#command-user)
  - [command: version](#command-version)
  - [command: voice](#command-voice)
  - [command: whois](#command-whois)

## Options

Client `options` are the object you provide when you create a new client
instance:

```ts
const options = {/* available options are described below */};

const client = new Client(options);
```

### option: authMethod

The auth method to use with a supplied username and password. Defaults to
NickServ if omitted.

The authentication method to use.

- `NickServ` - Non-standard nickserv authentication.
- `sasl` - SASL PLAIN auth. Errors out if SASL fails.
- `saslThenNickServ` - Try SASL PLAIN, but fallback to NickServ if it fails.

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
    version: "deno-irc",
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
  }
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

### event: away_reply

User replies with an away message.

```ts
client.on("away_reply", (msg) => {
  msg.params.nick; // nick of the client who is away
  msg.params.text; // text of away message
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
  msg.params.text;   // original DCC payload string
  msg.params.filename; // string
  msg.params.port;     // number (0 if passive)
  msg.params.position; // number (byte offset)
  msg.params.token;    // number | undefined
  msg.params.passive;  // boolean
});
```

### event: dcc_chat

User requests starting a direct chat session.
`SCHAT` is normalized here with `tls: true`.

```ts
client.on("dcc_chat", (msg) => {
  msg.params.text;   // original DCC payload string
  msg.params.ip;      // { type: "ipv4"|"ipv6"|"hostname"; value: string }
  msg.params.port;    // number (0 if passive)
  msg.params.token;   // number | undefined
  msg.params.passive; // boolean
  msg.params.tls;     // boolean (true if SCHAT, else false)
});
```

### event: dcc_resume

User requests resuming a file transfer.

```ts
client.on("dcc_resume", (msg) => {
  // common
  msg.params.action; // "resume"
  msg.params.text;   // original DCC payload string

  // payload
  msg.params.filename; // string
  msg.params.port;     // number (0 if passive)
  msg.params.position; // number (byte offset)
  msg.params.token;    // number | undefined
  msg.params.passive;  // boolean
});
```

### event: dcc_send

User offers sending a file.

```ts
client.on("dcc_send", (msg) => {
  msg.params.source     // { name: "nickname"; mask: { user: "string"; host: "string" } }
  msg.params.text;      // original DCC payload string
  msg.params.filename;  // string
  msg.params.ip;        // { type: "ipv4"|"ipv6"|"hostname"; value: string }
  msg.params.port;      // number (0 if passive)
  msg.params.size;      // number (bytes)
  msg.params.token;     // number | undefined
  msg.params.passive;   // boolean
});
```

### event: disconnected

Client has been disconnected from the server.

```ts
client.on("disconnected", (remoteAddr) => {
  remoteAddr; // address of the server
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

If `tls=true`, attempts to connect using a TLS connection.

Resolves when connected.

`async connect(hostname: string, port: number, tls?: boolean): Promise<Deno.Conn | null>`

```ts
client.connect("host", 6667);

client.connect("host", 7000, true); // with TLS
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
  args: { ip: "203.0.113.42", port: 6000 }
});
// returns: "PRIVMSG someone :\x01DCC CHAT 203.0.113.42 6000\x01"
```

```ts
// DCC SCHAT (secure chat)
client.dcc("someone", {
  action: "schat",
  args: { ip: "[2001:db8::1]", port: 6697 }
});
// returns: "PRIVMSG someone :\x01DCC SCHAT [2001:db8::1] 6697\x01"
```

```ts
// DCC SEND with size and optional token
client.dcc("someone", {
  action: "send",
  args: { filename: "file.bin", ip: "203.0.113.10", port: 5000, size: 123456, token: 42 }
});
// returns: "PRIVMSG someone :\x01DCC SEND file.bin 203.0.113.10 5000 123456 42\x01"
```

```ts
// DCC RESUME (request resuming at byte position)
client.dcc("someone", {
  action: "resume",
  args: { filename: "file.bin", port: 5000, position: 65536 }
});
// returns: "PRIVMSG someone :\x01DCC RESUME file.bin 5000 65536\x01"
```

```ts
// DCC ACCEPT (accept resume at byte position)
client.dcc("someone", {
  action: "accept",
  args: { filename: "file.bin", port: 5000, position: 65536 }
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

# deno-irc

![ci](https://github.com/jeromeludmann/deno-irc/workflows/ci/badge.svg)

IRC client protocol module for [Deno](https://deno.land/).

## Overview

IRC is not dead yet.

This module aims to provide to Deno community an easy way to communicate with
IRC through an abstraction built on top of the client protocol.

Semantic Versioning will be used but breaking changes are expected on minor versions prior to `1.0.0`.

Any feedback and contributions are welcome.

## Contents

- [Usage](#usage)
  - [Events](#events)
  - [Commands](#commands)
  - [Errors](#errors)
- [API](#api)
- [Contributing](#contributing)
- [License](#license)

## Usage

Code is better than words:

```ts
import { Client } from "https://deno.land/x/irc/mod.ts";

const client = new Client({
  nick: "my_nick",
  channels: ["#my_channel"],
});

client.on("join", (msg) => {
  if (msg.channel === "#my_channel") {
    client.privmsg("#my_channel", "Hello world!");
  }
});

await client.connect("irc.freenode.net", 6667);
```

Note that this code above requires the `--allow-net` option.

There are only two main concepts to know to use `deno-irc`: [events](#events) and [commands](#commands).

### Events

Events are simple messages which are emitted from the client instance.

They can be received by listening to their event names:

```ts
client.on("join" (msg) => {
  console.log(`${msg.origin.nick} has joined ${msg.channel}`);
});
```

Thanks to TypeScript, type of `msg` is always inferred from the event name so you do not have to worry about what is in the object or about the IRC protocol.

```ts
client.on("nick" (msg) => {
  console.log(`${msg.origin.nick} is now known as ${msg.nick}`);
});

client.on("privmsg", (msg) => {
  const { origin, target, text } = msg;
  console.log(`${origin.nick} on ${target} says ${text}`);
});
```

Some events, like `"privmsg"` and `"notice"`, can be filtered like this:

```ts
client.on("privmsg:channel", (msg) => {
  const { origin, channel, text } = msg;
  console.log(`${origin.nick} on ${channel} says ${text}`);
});

client.on("privmsg:private", (msg) => {
  const { origin, text } = msg;
  console.log(`${origin.nick} says to you ${text}`);
});
```

There are also other methods related to events which can be useful.

Following only resolves when the message has been received:

```ts
const msg = await client.once("join");
```

Following resolves when the message has been received, otherwise resolves after the given delay to `null`:

```ts
const msg = client.wait("join", 2000);

if (msg === null) {
  console.log("message not received on time");
}
```

### Commands

Commands are the way to send messages to the server.

They can be sent by calling them:

```ts
client.join("#channel");

client.privmsg("#channel", "Hello world!");

client.nick("new_nick");

client.topic("#channel", "New topic of the channel");

client.quit("Goodbye!");
```

### Errors

When an error is emitted, it will be thrown by default and causes a crash of the program.

To avoid the client from crashing, it is required to have at least one event listener for the `"error"` event name.

By listening to the `"error"` event, errors will no longer be thrown and you will be able to handle them properly:

```ts
client.on("error", (error) => {
  switch (error.type) {
    case "connect":
    // errors while connecting

    case "read":
    // errors while receiving messages from server

    case "write":
    // errors while sending messages to server

    case "close":
    // errors while closing connection
  }
});
```

This behavior is heavily inspired by the [Node.js error handling](https://www.joyent.com/node-js/production/design/errors).

An early crash prevents loosing useful informations when the client tries something without success.

## API

_Work in progress. You can use for the moment the code completion support from your IDE to discover other commands and event names._

## Contributing

_This is a first draft of a contributing section._

This module is mainly built around two patterns:

- event driven architecture
- internal plugins

It involves keeping the client as minimal as possible (the _core_) and delegates implementation of features to highly cohesive decoupled parts (which are called _plugins_).

The core contains some internal parts related to IRC protocol, TCP sockets and event system. Plugins contain all the extra features built on top of the core client.

In most of the cases, it is quite handy to add new features using plugins without touching the core.

### Run unit tests

All added parts (core and plugins) should be tested to ensure they work as expected:

```sh
make test
```

## License

MIT

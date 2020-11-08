# deno-irc

IRC client protocol module for [Deno](https://deno.land/).

## Overview

IRC is not dead yet.

This module aims to provide to Deno community an easy way to communicate with
IRC through an abstraction built on top of the client protocol.

Semantic Versioning will be used but breaking changes are expected on minor versions prior to `1.0.0`.

Any feedback and contributions are welcome.

## Contents

- [Usage](#usage)
- API
- [Contributing](#contributing)
- [License](#license)

## Usage

Code is better than words:

```ts
import { Client } from "https://deno.land/x/irc/mod.ts";

const client = new Client({ nick: "my_nick" });
client.connect("irc.freenode.net", 6667);
client.on("register", () => client.join("#my_chan"));
```

Note that this code above requires the `--allow-net` option.

There are only two main concepts to know to use this module: [events](#events) and [commands](#commands).

### Events

Events are simple messages which are emitted from the client instance.

They can be received by listening to their event names:

```ts
client.on("join" (msg) => {
  console.log(`${msg.origin.nick} joins ${msg.channel}`);
});
```

Thanks to TypeScript, type of `msg` is always inferred from the event name so you do not have to worry about what is in the object or about the specificities of the protocol.

```ts
client.on("nick" (msg) => {
  console.log(`${msg.origin.nick} is now known as ${msg.nick}`);
});

client.on("privmsg", (msg) => {
  console.log(`${msg.origin.nick} talks to ${msg.target}: ${msg.text}`);
});
```

Some events can be filtered like this:

```ts
client.on("privmsg:channel", (msg) => {
  console.log(`${msg.origin.nick} talks to ${msg.channel}: ${msg.text}`);
});

client.on("privmsg:private", (msg) => {
  console.log(`${msg.origin.nick} talks to you: ${msg.text}`);
});
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

### Uncaught errors

When an error is thrown, it causes a crash.

It is required to have event listeners for `"error:client"` and `"error:server"` to avoid the client from crashing.

By listening to these events, errors will no longer be thrown and you will be able to handle them properly:

```ts
client.on("error:client", (error) => {
  switch (error.op) {
    case "connect": // error while connecting
    case "plugin": // error from internal plugin
    default:
      console.error(error);
  }
});

client.on("error:server", (error) => {
  switch (error.command) {
    case "ERR_NICKNAMEINUSE": // nick is already in use
    case "ERR_NOSUCHCHANNEL": // channel does not exist
    case "ERROR": // error that causes a disconnection
    default:
      console.error(error);
  }
});
```

This behavior is heavily inspired by the [Node.js error handling](https://www.joyent.com/node-js/production/design/errors).

An early crash prevents loosing useful informations when the client tries something without success.

## Contributing

_This is a first draft of a contributing section._

This module is built around two patterns: event driven architecture and plugins.

It involves keeping the core as minimal as possible and delegates implementation of features to small independent parts (which are called plugins).

The core contains some internal parts related to main parsers, sockets and event emitter. The plugins contain all the extra features built on top of the core client.

In most of the cases, it is quite handy to add new features using plugins without touching the core.

### Run unit tests

All added parts (core and plugins) should be tested to ensure they work as expected:

```sh
make test
```

## License

MIT

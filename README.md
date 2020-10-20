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

It is also better to have at least one `"error"` event listener to avoid the client from crashing:

```ts
client.on("error", (error) => console.error(error));
```

There are only two main concepts to know to use this module: [events](#events) and [commands](#commands).

### Events

Events are simple messages which are emitted from the client instance.

They can be received by listening to their event names:

```ts
client.on("join" (msg) => {
  console.log(`${msg.origin.nick} joins ${msg.channel}`);
});

client.on("nick" (msg) => {
  console.log(`${msg.origin.nick} is now known as ${msg.nick}`);
});

client.on("msg:channel", (msg) => {
  console.log(`${msg.origin.nick} talks to ${msg.channel}: ${msg.text}`);
});

client.on("msg:private", (msg) => {
  console.log(`${msg.origin.nick} talks to you: ${msg.text}`);
});
```

Thanks to TypeScript, type of `msg` is always inferred from the event name so you do not have to worry about what is in the object or about the pecificities of the protocol.

### Commands

Commands are the way to send messages to the server.

They can be sent by calling them:

```ts
client.join("#channel");

client.msg("#channel", "Hello world!");

client.nick("new_nick");

client.topic("#channel", "New topic of the channel");

client.quit("Goodbye!");
```

### Uncaught errors

When an error is thrown, it causes a crash.

By listening to `"error"` events, errors will no longer be thrown and you will be
able to handle them properly:

```ts
client.on("error", (error) => {
  // deal with the error message

  switch (error.name) {
    case "ConnectError":
    case "SendError":
      console.log(`${error.name}: ${error.message}`);
      break;
    default:
      console.error(error);
  }
});
```

This behavior is heavily inspired by the Node.js event emitter pattern.

## Contributing

_This is a first draft of a contributing section._

This module is built around two patterns: event driven architecture and plugins.

It involves keeping the core as minimal as possible and delegates implementation of features to small independent parts (which are called plugins).

The core contains some internal parts related to main parsers, sockets and event emitter. The plugins contain all the extra features built on top of the core client.

In most of the cases, it is quite handy to add new features using plugins without touching the core.

## License

MIT

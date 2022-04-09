# deno-irc

![ci](https://github.com/jeromeludmann/deno-irc/workflows/ci/badge.svg)

IRC client protocol module for [Deno](https://deno.land/) which aims to provide
an easy way to talk with IRC servers.

Any feedback and contributions are welcome.

## Documentation

- [Getting Started](#getting-started)
- [API Reference](API.md)
- [Contributing](#contributing)

## Getting Started

There are only two main concepts to know: [events](#events) and
[commands](#commands).

Code is better than words:

```ts
import { Client } from "https://deno.land/x/irc/mod.ts";

const client = new Client({
  nick: "my_nick",
  channels: ["#my_channel"],
});

client.on("join", (msg) => {
  if (msg.params.channel === "#my_channel") {
    client.privmsg("#my_channel", "Hello world!");
  }
});

// connects with TLS
await client.connect("irc.libera.chat", 7000, true);

// connects without TLS
await client.connect("irc.libera.chat", 6667);
```

Note that this code above requires the `--allow-net` option.

### Events

Events are simple messages which are emitted from the client instance.

They can be received by listening to their event names:

```ts
client.on("join", (msg) => {
  const { source, params } = msg;
  console.log(`${source?.name} has joined ${params.channel}`);
});
```

Thanks to TypeScript, type of `msg` is always inferred from the event name so
you do not have to worry about what is in the object or about the IRC protocol.

```ts
client.on("nick", ({ source, params }) => {
  console.log(`${source?.name} is now known as ${params.nick}`);
});

client.on("privmsg", ({ source, params }) => {
  console.log(`${source?.name} on ${params.target} says ${params.text}`);
});
```

Some events, like `"privmsg"` and `"notice"`, can be filtered like this:

```ts
client.on("privmsg:channel", ({ source, params }) => {
  console.log(`${source?.name} on ${params.target} says ${params.text}`);
});

client.on("notice:private", ({ source, params }) => {
  console.log(`${source?.name} notices to you: ${params.text}`);
});
```

Subscribing to more than one event is also possible by passing an array of event
names:

```ts
client.on(["part", "kick"], (msg) => {
  // msg is PartEvent | KickEvent
});
```

There are also other methods related to events which can be useful, following
only resolves when the message has been received:

```ts
const msg = await client.once("join");
```

🔎 See [Event API](API.md#events).

### Commands

Commands are the way to send messages to the server.

They can be sent by just calling them:

```ts
client.join("#channel");

client.privmsg("#channel", "Hello world!");

client.quit("Goodbye!");
```

🔎 See [Command API](API.md#commands).

### Errors

When an error is emitted, it will be thrown by default and causes a crash of the
program.

To avoid the client from crashing, **it is required to have at least one event
listener for the `"error"` event name**.

🔎 See [Error Event API](API.md#event-error).

## Contributing

This module is mainly built around two patterns:

- event driven architecture
- internal plugins

It involves keeping the client as minimal as possible (the _core_) and delegates
implementation of features to highly cohesive decoupled parts (which are called
_plugins_).

The core contains some internal parts related to IRC protocol, TCP sockets and
event system. Plugins contain all the extra features built on top of the core
client.

In most of the cases, it is quite handy to add new features using plugins
without touching the core.

All added parts (core and plugins):

- should be tested to ensure they work as expected
- should provide documentation about its options, events, commands

Need help? Type `make help`.

## License

[MIT](LICENSE)

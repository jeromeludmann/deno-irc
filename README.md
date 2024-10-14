# deno-irc

![ci](https://github.com/jeromeludmann/deno-irc/workflows/ci/badge.svg)

IRC client protocol module for [Deno](https://deno.land/) which aims to provide
an easy way to talk with IRC servers.

Any feedback and contributions are welcome.

Now available on [JSR](https://jsr.io/@irc/client).

## Documentation

- [Getting Started](#getting-started)
- [API Reference](https://github.com/jeromeludmann/deno-irc/blob/main/API.md)

## Getting Started

The first thing to do is to import the `Client`:

```ts
import { Client } from "https://deno.land/x/irc/mod.ts";
```

and just instantiate a new client like this:

```ts
const client = new Client({
  nick: "my_nick",
  channels: ["#my_channel"],
});
```

One instance manages one connection. If you want to connect to many servers, use
many instances.

See [API Reference](https://github.com/jeromeludmann/deno-irc/blob/main/API.md#options) to learn more about available options.

Then you can listen to [events](#events) and send [commands](#commands):

```ts
client.on("join", (msg) => {
  if (msg.params.channel === "#my_channel") {
    client.privmsg("#my_channel", "Hello world!");
  }
});
```

Finally you have to establish a connection with the server:

```ts
await client.connect("irc.libera.chat", 6667);

await client.connect("irc.libera.chat", 7000, true); // with TLS
```

Note that connecting to servers requires the `--allow-net` option:

```
deno run --allow-net ./code.ts
```

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

See [API Reference](https://github.com/jeromeludmann/deno-irc/blob/main/API.md#events) to learn more about events.

### Commands

Commands are the way to send messages to the server.

They can be sent by just calling them:

```ts
client.join("#channel");

client.privmsg("#channel", "Hello world!");

client.quit("Goodbye!");
```

See [API Reference](https://github.com/jeromeludmann/deno-irc/blob/main/API.md#commands) to learn more about commands.

### Errors

When an error is emitted, it will be thrown by default and causes a crash of the
program.

To avoid the client from crashing, **it is required to have at least one event
listener for the `"error"` event name**.

See [API Reference](https://github.com/jeromeludmann/deno-irc/blob/main/API.md#event-error) to learn more about errors.

## Contributing

This module is mainly built around two patterns:

- event driven architecture
- internal plugins

It involves keeping the _core_ client as minimal as possible and delegates
feature implementations to decoupled _plugins_ parts.

The core contains some internal parts related to IRC protocol, TCP sockets and
event system. Plugins contain all the extra features built on top of the core
client.

In most of the cases, it is quite handy to add new features using plugins
without touching the core.

All added parts (core and plugins):

- should be tested to ensure they work as expected
- should provide documentation about its options, events, commands

Need help? Type `deno task`.

## License

[MIT](LICENSE)

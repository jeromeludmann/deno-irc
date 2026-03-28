# Contributing

Any feedback and contributions are welcome.

## Architecture

This module is mainly built around two patterns:

- event driven architecture
- internal plugins

It involves keeping the _core_ client as minimal as possible and delegates
feature implementations to decoupled _plugins_ parts.

The core contains some internal parts related to IRC protocol, TCP sockets and
event system. Plugins contain all the extra features built on top of the core
client. Runtime-specific code (Deno, Node.js, Bun) is isolated in the `runtime/`
directory behind a common interface.

In most of the cases, it is quite handy to add new features using plugins
without touching the core.

All added parts (core and plugins):

- should be tested to ensure they work as expected
- should provide documentation about its options, events, commands

## Writing a plugin

Almost every feature in this library is a plugin. Adding a new one never
requires touching the core — you create a file, declare what it provides, and
register it.

### Plugin anatomy

A plugin is created with `createPlugin` and declares its **features** through a
TypeScript interface. There are five possible feature keys:

| Key        | Purpose                                            | Accessed via                        |
| ---------- | -------------------------------------------------- | ----------------------------------- |
| `options`  | Configuration the user can pass at client creation | `options` argument in init function |
| `commands` | Methods added to the client instance               | `client.<command>()`                |
| `events`   | Events the plugin can emit                         | `client.on("<event>", handler)`     |
| `state`    | Shared state attached to the client                | `client.state.<key>`                |
| `utils`    | Helper functions attached to the client            | `client.utils.<fn>()`               |

All five are optional — use only what you need.

Here is a minimal example (simplified from `plugins/away.ts`):

```ts
import { type Message } from "../core/parsers.ts";
import { createPlugin, type Plugin } from "../core/plugins.ts";

// 1. Define your event payload types.
interface AwayReplyEventParams {
  nick: string;
  text: string;
}
type AwayReplyEvent = Message<AwayReplyEventParams>;

// 2. Declare the features your plugin provides.
interface AwayFeatures {
  commands: {
    away(text?: string): void;
    back(): void;
  };
  events: {
    "away_reply": AwayReplyEvent;
  };
  state: {
    away: boolean;
  };
}

// 3. Create the plugin. First arg is the name, second is dependencies.
const plugin: Plugin<AwayFeatures> = createPlugin("away")((client) => {
  // Initialize state.
  client.state.away = false;

  // Register commands.
  client.away = (text) => {
    client.send("AWAY", text);
  };
  client.back = () => {
    client.away();
  };

  // Listen to raw IRC events and emit typed events.
  client.on("raw:rpl_away", (msg) => {
    const { source, params: [, nick, text] } = msg;
    client.emit("away_reply", { source, params: { nick, text } });
  });

  // Update state from server replies.
  client.on("raw:rpl_unaway", () => client.state.away = false);
  client.on("raw:rpl_nowaway", () => client.state.away = true);
});

export default plugin;
```

### Starter template

Copy-paste this to create a new plugin:

```ts
import { type Message } from "../core/parsers.ts";
import { createPlugin, type Plugin } from "../core/plugins.ts";

interface MyEventParams {
  // your event fields
}
type MyEvent = Message<MyEventParams>;

interface MyPluginFeatures {
  // commands: { myCommand(arg: string): void };
  // events: { "my_event": MyEvent };
  // state: { myState: string };
  // utils: { myHelper(): boolean };
  // options: { myOption?: string };
}

const plugin: Plugin<MyPluginFeatures> = createPlugin("my-plugin")(
  (client, options) => {
    // initialize state, register commands, listen to events
  },
);

export default plugin;
```

### Dependencies

If your plugin needs features from another plugin, declare it as a dependency:

```ts
import { type AnyPlugins, createPlugin, type Plugin } from "../core/plugins.ts";
import cap from "./cap.ts";
import join from "./join.ts";

const plugin: Plugin<MyFeatures, AnyPlugins> = createPlugin(
  "my-plugin",
  [cap, join], // loaded before your plugin
)((client) => {
  // You can now use features from cap and join:
  client.state.capabilities.push("my-cap"); // from cap plugin
});
```

Dependencies are resolved depth-first. Circular dependencies are detected and
throw an error. A plugin is never initialized twice, even if listed as a
dependency by multiple plugins.

### Events

**Listening to raw IRC messages:**

Every IRC message is emitted as `raw:<command>` (e.g., `raw:privmsg`,
`raw:rpl_away`, `raw:err_nicknameinuse`). The command names are defined in
`core/protocol.ts`.

```ts
client.on("raw:privmsg", (msg) => {
  const { source, params: [target, text] } = msg;
  // msg.tags contains IRCv3 message tags if present
});
```

**Emitting typed events:**

```ts
client.emit("my_event", {
  source, // Message source (server or user)
  params: { field: "value" }, // Your typed params
});
```

**Multi-events** group related sub-events under a single name:

```ts
client.createMultiEvent("privmsg", ["privmsg:channel", "privmsg:private"]);
// client.on("privmsg", ...) now triggers on either sub-event
```

**Naming conventions:** `snake_case` for event names, colon `:` for sub-events
(e.g., `privmsg:channel`, `notice:private`).

### Hooks

The hooks system lets plugins intercept method calls and state mutations on the
client. Available hooks:

- `client.hooks.beforeCall(key, hook)` — run code before a method call
- `client.hooks.afterCall(key, hook)` — run code after a method returns
- `client.hooks.hookCall(key, hook)` — fully wrap a method call
- `client.hooks.beforeMutate(key, hook)` — intercept property mutations via
  Proxy

See `core/hooks.ts` for details and type signatures.

### Registration

Once your plugin is written:

1. Create `plugins/<name>.ts` and `plugins/<name>_test.ts`
2. Add three entries in `plugins/mod.ts`:
   - A named export: `export { default as myPlugin } from "./my_plugin.ts";`
   - An import: `import myPlugin from "./my_plugin.ts";`
   - An entry in the `plugins` array: `myPlugin,`
3. Document your plugin in `API.md` (options, events, commands)

### Testing

Tests use a mock infrastructure that simulates an IRC connection in memory.

```ts
import { assertEquals } from "@std/assert";
import { describe } from "../testing/helpers.ts";
import { mock } from "../testing/mock.ts";

describe("plugins/my_plugin", (test) => {
  // Test a command (client → server).
  test("send MY_COMMAND", async () => {
    const { client, server } = await mock();

    client.myCommand("arg");
    const raw = server.receive(); // returns sent messages and clears buffer

    assertEquals(raw, ["MY_COMMAND arg"]);
  });

  // Test an event (server → client).
  test("emit 'my_event' on RAW_REPLY", async () => {
    const { client, server } = await mock();

    server.send(":serverhost 123 me param :trailing");
    const msg = await client.once("my_event");

    assertEquals(msg, {
      source: { name: "serverhost" },
      params: {/* your expected params */},
    });
  });

  // Test state updates.
  test("update state on event", async () => {
    const { client, server } = await mock();

    assertEquals(client.state.myState, false);
    server.send(":serverhost SOME_COMMAND");
    await client.once("raw:some_command");
    assertEquals(client.state.myState, true);
  });
});
```

Key testing utilities:

- `mock(options?, mockOptions?)` — creates a `{ client, server }` pair with all
  plugins loaded
- `server.send(raw)` — simulates receiving a message from the IRC server
- `server.receive()` — returns all messages sent by the client since last call
  (resets the buffer)
- `client.once(event)` — returns a promise that resolves on the next event
- `client.on(event, handler)` — subscribes to an event

## Development

Prerequisites:

- [Deno](https://deno.land/) 2+
- [Node.js](https://nodejs.org/) 22+ (for cross-runtime testing)
- [Bun](https://bun.sh/) (for cross-runtime testing)
- [Docker](https://www.docker.com/) (for integration tests)

### Deno

- `deno task test` — run unit tests
- `deno task lint` — lint the codebase
- `deno task fmt` — format the codebase
- `deno task test:integration` — run integration tests (all ircd)
- `deno task test:integration:ergo` — run integration tests (Ergo)
- `deno task test:integration:inspircd` — run integration tests (InspIRCd)
- `deno task test:integration:unrealircd` — run integration tests (UnrealIRCd)

### Node.js

- `npm run test:node` — run unit tests
- `npm run typecheck:node` — type-check Node-specific files
- `npm run test:node:integration` — run integration tests (all ircd)
- `npm run test:node:integration:ergo` — run integration tests (Ergo)
- `npm run test:node:integration:inspircd` — run integration tests (InspIRCd)
- `npm run test:node:integration:unrealircd` — run integration tests (UnrealIRCd)

### Bun

- `bun run test:bun` — run unit tests
- `bun run typecheck:bun` — type-check Bun-specific files
- `bun run test:bun:integration:ergo` — run integration tests (Ergo)

## CI testing strategy

The CI tests the real axes of variation without redundancy. Integration jobs
depend on unit tests — if parsing is broken, there's no point starting a server.

**Unit tests** validate parsing, plugin logic and events. They run once per
runtime (Deno, Node, Bun) on Ubuntu — unit tests use mocks with no network or
filesystem calls, so the OS has no impact. Lint and formatting checks run in the
Deno job.

**Integration tests** validate the IRC protocol against real ircd over the
network on Ubuntu (Docker required). Deno runs against every supported ircd
(Ergo, InspIRCd, UnrealIRCd) to cover protocol variations between
implementations. Node and Bun run
against Ergo only — the same parser and plugins produce identical bytes on the
wire regardless of runtime, so one ircd is enough to validate each runtime's
network layer.

Ergo is the reference ircd for cross-runtime and cross-OS tests because it's the
fastest to start (Go, no DH generation) and the most feature-complete (built-in
NickServ, SASL, full IRCv3 caps). Account-dependent tests (NickServ, SASL PLAIN,
SASL EXTERNAL) only run on Ergo — other ircd would require external services
(Anope/Atheme) for marginal coverage gain.

## Releasing (maintainers)

Releases are handled by a single GitHub Actions workflow. To create a release:

```
gh workflow run release.yml -f release-type=patch|minor|major
```

Or trigger it manually from the Actions tab on GitHub.

This will:

1. Bump the version in `deno.json`
2. Commit `chore: release X.Y.Z` and push to `main`
3. Create and push tag `vX.Y.Z`
4. Publish to [JSR](https://jsr.io/@irc/client)
5. Create a GitHub Release with a changelog generated from conventional commits

The changelog groups commits by type (`feat` → Features, `fix` → Bug Fixes).
Use [conventional commits](https://www.conventionalcommits.org/) to get clean
release notes.

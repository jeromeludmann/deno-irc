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
client.

In most of the cases, it is quite handy to add new features using plugins
without touching the core.

All added parts (core and plugins):

- should be tested to ensure they work as expected
- should provide documentation about its options, events, commands

## Development

Prerequisites: [Deno](https://deno.land/) v2.x

Run `deno task` to see all available commands. Key tasks:

- `deno task test` — run unit tests
- `deno task lint` — lint the codebase
- `deno task fmt` — format the codebase

## Releasing (maintainers)

Releases are automated via GitHub Actions. To create a release:

```
gh workflow run release.yml -f release-type=patch|minor|major
```

This will:

1. Bump the version in `deno.json`
2. Commit `chore: release X.Y.Z` and tag `vX.Y.Z`
3. Push to `main`
4. Automatically publish to [JSR](https://jsr.io/@irc/client) and create a
   GitHub Release with auto-generated notes

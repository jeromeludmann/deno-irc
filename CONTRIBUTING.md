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

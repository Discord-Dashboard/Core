# @acstane/dashboard

Open source dashboard framework for Discord bots.

Configure your bot from the web without writing OAuth or API glue. Define your
settings as a declarative schema, get a modern dashboard, and let server admins
manage the bot per guild.

> Looking for v2? It lives on the [`v2` branch](https://github.com/Discord-Dashboard/Core/tree/v2)
> and is still published on npm as `discord-dashboard`. Fixes for v2 go to that
> branch.

## Why v3

- Fully open source (MIT). No license server, no obfuscation.
- Protocol first core. Your bot can be written in any language and connect over
  a small adapter protocol, or run in process with discord.js.
- Schema driven settings instead of scattered callbacks.
- Drag and drop page builder with an optional AI assist.
- Secure by default: PKCE, CSRF, rate limits, encrypted token storage.

## Packages

| Package | Role |
| --- | --- |
| `@acstane/dashboard` | Batteries included lite mode for discord.js self host |
| `@acstane/core` | Engine: HTTP API, OAuth, bot gateway, settings, entitlements and billing |
| `@acstane/platform-discord` | Discord login, server list, discord.js pickers and SKU purchases |
| `@acstane/schema` | Declarative settings schema (Zod) |
| `@acstane/protocol` | Bot adapter protocol, source of truth |
| `@acstane/sdk-js` | Bot adapter SDK for Node |
| `discord-dashboard` (PyPI) | Bot adapter SDK for Python, in `packages/sdk-py` |
| `@acstane/web` | The prebuilt web dashboard that lite mode serves |
| `@acstane/create` | Project scaffolder (`npm init @acstane@beta`) |
| `@acstane/dashboard-ui` | Component library and themes |
| `@acstane/builder` | Page builder (Puck) and AI generation |
| `@acstane/db` | Drizzle schema and SQLite storage |
| `@acstane/compat-v2` | Adapter for v2 settings, for migration |
| `@acstane/marketplace` | Module and theme registry |
| `@acstane/modules` | Reference feature modules (`module-leveling`, `module-tickets`, `module-automod` and more), one package each or all together |

## Status

Public beta. Install with `@beta`:

```bash
npm init @acstane@beta my-bot   # a new bot with a dashboard
npm install @acstane/dashboard@beta        # or add it to an existing bot
```

The [`@acstane/dashboard` README](meta/dashboard/README.md) has the
quick start. Expect some changes before 3.1.0. Report bugs and feedback in
[GitHub issues](https://github.com/Discord-Dashboard/Core/issues) or the
[support Discord](https://discord.gg/6Yv5U9V3ux). Decisions behind v3 are in
[`docs/adr`](docs/adr/README.md).

## License

MIT

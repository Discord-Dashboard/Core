# discord-dashboard

Open source dashboard framework for Discord bots.

Configure your bot from the web without writing OAuth or API glue. Define your
settings as a declarative schema, get a modern dashboard, and let server admins
manage the bot per guild.

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
| `discord-dashboard` | Batteries included lite mode for discord.js self host |
| `@discord-dashboard/core` | Engine: API, bot gateway, schema render |
| `@discord-dashboard/schema` | Declarative settings schema (Zod) |
| `@discord-dashboard/protocol` | Bot adapter protocol, source of truth |
| `@discord-dashboard/sdk-js` | Bot adapter SDK for Node |
| `@discord-dashboard/sdk-py` | Bot adapter SDK for Python |
| `@discord-dashboard/ui` | Component library and themes |
| `@discord-dashboard/builder` | Page builder (Puck) and AI generation |
| `@discord-dashboard/billing` | Entitlements: Stripe Connect and Discord SKUs |
| `@discord-dashboard/db` | Drizzle schema and SQLite storage |
| `@discord-dashboard/compat-v2` | Adapter for v2 settings, for migration |
| `@discord-dashboard/marketplace` | Module and theme registry |
| `@discord-dashboard/modules/*` | Reference feature modules (leveling, tickets, automod, and more) |

## Status

Work in progress. See the roadmap in the docs.

## License

MIT

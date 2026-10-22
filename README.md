# asctane-dashboard

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
| `asctane-dashboard` | Batteries included lite mode for discord.js self host |
| `@asctane-dashboard/core` | Engine: API, bot gateway, schema render |
| `@asctane-dashboard/platform-discord` | Discord login, server list, discord.js pickers and SKU purchases |
| `@asctane-dashboard/schema` | Declarative settings schema (Zod) |
| `@asctane-dashboard/protocol` | Bot adapter protocol, source of truth |
| `@asctane-dashboard/sdk-js` | Bot adapter SDK for Node |
| `@asctane-dashboard/sdk-py` | Bot adapter SDK for Python |
| `@asctane-dashboard/ui` | Component library and themes |
| `@asctane-dashboard/builder` | Page builder (Puck) and AI generation |
| `@asctane-dashboard/billing` | Entitlements: Stripe Connect and platform purchases |
| `@asctane-dashboard/db` | Drizzle schema and SQLite storage |
| `@asctane-dashboard/compat-v2` | Adapter for v2 settings, for migration |
| `@asctane-dashboard/marketplace` | Module and theme registry |
| `@asctane-dashboard/modules/*` | Reference feature modules (leveling, tickets, automod, and more) |

## Status

Work in progress. See the roadmap in the docs.

## License

MIT

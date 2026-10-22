# Changelog

## Unreleased (3.1.0-alpha)

Versioned 3.1.0 to follow the 3.0.x prereleases published as discord-dashboard
from earlier attempts.

A ground up rewrite, published under a new name. Highlights:

- New npm names: the main package is `asctane-dashboard` (was
  `discord-dashboard`), every other package moves from `@discord-dashboard/*`
  to `@asctane-dashboard/*`, and the scaffolder is `@asctane-dashboard/create`
  (`npm init @asctane-dashboard`). The Python SDK keeps its PyPI name for now.
- Fully open source (MIT). No license server, no obfuscation.
- Protocol first core with a bot adapter over WebSocket. Node and Python SDKs.
- Declarative settings schema (Zod) shared across server, client and SDKs.
- Lite mode (SQLite, in process) and a platform profile (Postgres, Redis).
- Drag and drop page builder with an AI generation pipeline (validated JSON).
- Entitlements over Stripe Connect and Discord SKUs.
- Live settings updates over server sent events.
- Actions, stats and event push across the protocol.
- Security by default: PKCE, sessions, origin checks, rate limits, headers.
- Reference modules: leveling, automod, tickets, giveaways, onboarding,
  reaction roles, autoresponder.
- v2 compatibility layer and a project scaffolder.
- Every API route lives under `/api`: auth is `/api/auth/*` (OAuth redirect
  `/api/auth/callback`), webhooks are `/api/webhooks/*`, plus
  `/api/openapi.json` and `/api/version`. Only the `/health`, `/ready` and
  `/metrics` probes stay at the root.
- Core is platform neutral: settings, entitlements, audit entries and the
  in-process adapter are scoped to a space (a Discord server, Slack
  workspace, Telegram group or Twitch channel) instead of a guild.
  Breaking: `SubjectType.Guild` is now `SubjectType.Space`, settings
  contexts take `spaceId`, and the in-process adapter takes a `SpaceSource`
  (`resources(spaceId, kind, filter)`) instead of a `DiscordSource`. Stripe
  metadata should use `subjectType: "space"`; older `"guild"` subscriptions
  are still read as spaces.
- Discord support lives in its own package, `@asctane-dashboard/platform-discord`:
  OAuth login, the list of servers a user may manage, and the discord.js
  channel and role pickers. Breaking for anyone calling the API directly:
  `ApiConfig.discord` is replaced by `platforms: [discord({ clientId,
  clientSecret, redirectUri })]`, and `loadConfig()` takes the platforms to
  use. The lite `createDashboard({ discord })` option is unchanged.
- Discord SKU purchases moved to `@asctane-dashboard/platform-discord` behind the
  platform `billing` hook, so `@asctane-dashboard/billing` has no Discord code.
  `/api/webhooks/:platform` serves any platform with a billing hook
  (`/api/webhooks/discord` is unchanged). Breaking: `grantFromDiscordEntitlement`
  is replaced by `grantFromPlatform`, and `GrantSource.Discord` by
  `GrantSource.Platform` plus `Grant.platform`.
- `@asctane-dashboard/core` now holds the HTTP API, OAuth, the bot gateway and
  billing. `@asctane-dashboard/api` and `@asctane-dashboard/billing` are gone:
  import `buildServer`, `ApiConfig`, `createEntitlements` and the rest from
  core. The standalone server is the private `apps/server` app.

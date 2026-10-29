# Changelog

## Unreleased

- Security: the bot gateway no longer lets one malformed message or broken
  WebSocket frame stop the server, and frames are capped at 1 MiB
  (`maxPayload` option).
- Security, breaking: billing webhooks are only accepted when they can be
  verified, and answer 503 otherwise. Stripe webhooks check `Stripe-Signature`
  against `STRIPE_WEBHOOK_SECRET` (`stripeWebhookSecret`). Discord webhooks
  check Discord's Ed25519 signature against the app's public key
  (`discord({ publicKey })`, `DISCORD_PUBLIC_KEY`), read Discord's
  `ENTITLEMENT_CREATE`, `_UPDATE` and `_DELETE` events and answer PING with
  204. `WEBHOOK_SECRET` stays as a shared header for your own relays.
  `createDashboard` takes `discord.publicKey` and `billing`.
- Bot SDKs (JS and Python): a handler that throws now answers the dashboard
  with a JSON-RPC error and keeps the connection, instead of exiting the bot
  (JS) or dropping the connection (Python).
- Web dashboard: logged-out visitors are sent to the login page instead of
  seeing a server's settings page, and a server you can't manage says so. The
  top bar shows your name and avatar with a log out button, and a Log in
  button when you're signed out.
- Web dashboard: multi-value fields (channels, roles, multi-select) use a
  searchable picker with removable chips instead of a small list box.
- The Daylight theme is a full light theme, so cards, inputs and text all
  switch. Themes can set `color-scheme`, and the dashboard remembers the theme
  you picked.

## 3.1.0-beta.0 (public beta)

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
- Both SDKs answer picker lookups: `onResources` / `on_resources` list a
  space's channels and roles, and `onPermissions` / `on_permissions` a
  member's permissions. The Python adapter has a `start()` coroutine for bots
  that already run an asyncio loop.
- The web dashboard ships prebuilt as `@asctane-dashboard/web`, and
  `createDashboard` serves it on the API's own port, so a bot gets the full
  dashboard from npm without cloning the repo. Pass `web: false` to serve only
  the API, or `web: { root }` to serve your own static build.
- `dash.get(spaceId, key)` reads a setting in lite mode, with its default when
  it was never set, and `createDashboard` takes your own `adapter`.
- `fromV2` maps every v2 form type, select lists and descriptions included,
  and takes a `source` for live channel and role pickers.
- Drag and drop page builder with an AI generation pipeline (validated JSON).
- Entitlements over Stripe Connect and Discord SKUs.
- Live settings updates over server sent events.
- Actions, stats and event push across the protocol.
- Security by default: PKCE, sessions, origin checks, rate limits, headers.
- Reference modules: leveling, automod, tickets, giveaways, onboarding,
  reaction roles, autoresponder.
- v2 compatibility layer and a project scaffolder.
- Every package ships a README and declares Node.js 20 or later. The
  scaffolder prints the next steps, and each release tag creates a GitHub
  release with its changelog section.
- Every API route lives under `/api`: auth is `/api/auth/*` (OAuth redirect
  `/api/auth/:platform/callback`), webhooks are `/api/webhooks/*`, plus
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
- Bot protocol 2.0.0: `guild.channels` and `guild.roles` are one
  `space.resources { spaceId, kind, filter? }` call, `guild.member.permissions`
  is `space.member.permissions`, `guild.updated` is `space.updated`, and every
  `guildId` param (including in `setting.changed`) is `spaceId`. The
  `GuildNotFound` error code is `SpaceNotFound`. Breaking: the gateway refuses
  1.x bots, so update the SDK along with the dashboard.
- Space routes: `/api/guilds` is `/api/spaces` (returns `{ platform, spaces }`)
  and `/api/guilds/:guildId/...` is `/api/spaces/:platform/:spaceId/...`. A
  user can only reach spaces on the platform they logged in with. Each login
  finishes at `/api/auth/:platform/callback` (Discord's default redirect uri is
  now `/api/auth/discord/callback`); `/api/auth/callback` still works as an
  alias, so an app registered with it keeps logging in.
- Database: the `guild_settings` table is now `space_settings`, keyed by
  (bot, platform, space, key), so the same id on two platforms never clashes.
  The SQL migrations ship in `@asctane-dashboard/db` and `migrateDb(db)`
  applies them.
- Fields: `f.ref(kind, { multiple, filter })` is the one picker for things in
  a space. `f.channel`, `f.channelMulti`, `f.role` and `f.roleMulti` are
  aliases of it for the beta, and their wire type is now `ref` (older
  `channel` and `roleMulti` descriptors are still read). Breaking: `f.embed`
  moved to `@asctane-dashboard/platform-discord`, which exports an extended `f`
  with typed Discord channel and role options; the main `asctane-dashboard`
  package exports that `f`. `fromWire` and `buildDefFromAdapter` take a
  platform's extra field types.
- SDKs: handlers in `@asctane-dashboard/sdk-js` and the Python SDK take a
  space id instead of a guild id, and get the platform id too (last in JS; as
  a `platform` keyword in Python when the handler declares it, along with
  `actor`). Both SDKs have `f.ref`, and the Python `f.channel(types=...)`
  filter now reaches the wire. `RemoteAdapter` takes `{ platform }` and sends
  it with every space call.
- Modules declare `requires` (the resource kinds they pick) and, when only
  Discord can run them, `platforms: ["discord"]` (tickets and reaction roles).
  `modulesFor(modules, platform)` and `composeModules(mods, { platform })`
  leave out the modules a platform cannot run.
- Web app: space pages live at `/dashboard/:platform/:spaceId`, and `/login`
  shows one button per configured platform (from the new `/api/platforms`).
  Settings render through a field widget registry: core widgets (switch,
  select, text, and a live `ref` picker backed by the new
  `/api/spaces/:platform/:spaceId/resources/:kind`), plus each platform's own.
  Discord's embed editor ships in `@asctane-dashboard/platform-discord/web`.

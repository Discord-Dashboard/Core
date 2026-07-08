# Architecture

The core idea is protocol first. Three things are stable and everything else is
a client or a deployment of them:

1. Schema. Settings and pages are declared as data (`@discord-dashboard/schema`).
2. Bot adapter protocol. How a bot and the dashboard talk (`@discord-dashboard/protocol`).
3. Entitlements. One question, many billing sources (`@discord-dashboard/billing`).

## Two profiles, one codebase

- Lite: the bot and dashboard run in one process. The adapter is in process,
  storage is SQLite, no external services. This is the `discord-dashboard`
  meta package and is the fastest way to self host.
- Platform: the dashboard is a standalone service. Bots connect over the
  gateway from any language. Storage is Postgres, sessions and pub sub use
  Redis. This is the same core, different wiring.

## Bot adapter protocol

The bot connects out to the gateway over WebSocket and proves identity by
signing a server nonce (HMAC-SHA256). Frames are JSON-RPC 2.0. No inbound port
is needed on the bot side. The dashboard calls `settings.describe`,
`setting.get`, `setting.set`, `guild.channels`, `guild.roles` and
`guild.member.permissions`. The bot pushes `setting.changed` and stats.

A bot in any language works as long as it speaks the protocol. This repo ships
Node and Python SDKs, verified by a cross language wire parity test.

## Settings

Settings are a declarative schema (Zod) that validates on the server and
renders on the client. The engine reads and writes through the adapter, gated
by entitlements and validated by the schema. There is no per option callback
soup.

## Builder

Pages are data, never code. A page references only whitelisted components, so a
drag and drop or AI generated page cannot inject markup or scripts. The AI
builder emits validated JSON with a repair loop, not raw code.

## Security

Discord OAuth2 with PKCE and state, server side sessions, http only cookies,
an origin check on mutations, rate limiting and security headers on by default.

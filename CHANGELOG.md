# Changelog

## Unreleased (3.0.0-alpha)

A ground up rewrite. Highlights:

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

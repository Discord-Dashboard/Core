# ADR 2: Every API route under `/api`

- Status: Accepted
- Date: 2026-10-21

**Context.** The web app and the API now share one origin, so their paths must not collide.

**Decision.** All API routes live under `/api`: auth at `/api/auth/*` (OAuth callback `/api/auth/:platform/callback`), webhooks at `/api/webhooks/*`, plus `/api/openapi.json` and `/api/version`. Only the `/health`, `/ready` and `/metrics` probes stay at the root.

**Consequences.** Bots moving from v2 change their Discord redirect from `/discord` to `/api/auth/discord/callback`. The migration guide says so.

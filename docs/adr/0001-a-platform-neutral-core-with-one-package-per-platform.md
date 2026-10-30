# ADR 1: A platform-neutral core with one package per platform

- Status: Accepted
- Date: 2026-10-22

**Context.** v3 was written for Discord only: settings, entitlements and the adapter were keyed by guild, and the API lived in a separate `apps/api`. Supporting Slack, Telegram or Twitch would have meant forking that code.

**Decision.** Core is platform neutral and talks about a _space_ (a Discord server, Slack workspace, Telegram group or Twitch channel). Each platform is its own package under `packages/platforms/<name>` that implements a `Platform` interface: login, the list of spaces a user may manage, pickers, platform fields and billing. Discord is `@acstane/platform-discord`. `@acstane/core` absorbed the HTTP API, OAuth, the bot gateway and billing.

**Consequences.** Merged in M1 as Core PRs #122 to #132. It broke the earlier v3 API (`SubjectType.Guild` is now `Space`, `ApiConfig.discord` is now `platforms: [discord(...)]`), which is fine because nothing was published. The lite `createDashboard({ discord })` option is unchanged. M4 (#116) builds a second platform to prove the interface.

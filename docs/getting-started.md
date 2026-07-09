# Getting started

## Lite mode (discord.js, self host)

```js
import { Client } from "discord.js"
import { createDashboard, defineSettings, f } from "discord-dashboard"

const client = new Client({ intents: [] })
const settings = defineSettings((s) => ({
  general: s.category({
    name: "General",
    options: {
      prefix: f.text({ label: "Prefix", max: 3, default: "!" }),
      logChannel: f.channel({ types: ["text"] }),
    },
  }),
}))

const dash = createDashboard({
  client,
  discord: { clientId: "...", clientSecret: "..." },
  settings,
  // Persist settings to a local SQLite file so they survive restarts. Omit for
  // in memory storage, or pass your own store.
  storage: "sqlite",
})
await dash.listen(3001)
```

## Feature modules

Reference modules (leveling, tickets, automod, giveaways, onboarding, reaction
roles, autoresponder) each declare their own settings schema. Pick the ones you
want and compose them into a single dashboard schema:

```js
import { createDashboard } from "discord-dashboard"
import { composeModules } from "@discord-dashboard/modules"
import { leveling } from "@discord-dashboard/module-leveling"
import { tickets } from "@discord-dashboard/module-tickets"

const settings = composeModules([leveling, tickets])
const dash = createDashboard({ discord: { clientId, clientSecret }, settings })
```

Category ids must be unique across the modules you compose; a collision throws
so a setting is never silently dropped.

## Any language (protocol mode)

Run `@discord-dashboard/core` as a service and connect your bot with an SDK.
See `examples/bot-dpy` for a Python bot that connects over the gateway.

## Pages and the builder

Pages built with the drag and drop builder are stored as validated data, never
markup, so a stored page can never carry an unknown component or an unsafe url.

- `GET /api/pages` lists the slugs of published pages.
- `GET /api/pages/:slug` returns a published page for rendering.
- `POST /api/pages/:slug` saves a page (`{ content, status }`); the content is
  validated against the page schema before it is stored.
- `POST /api/pages/:slug/generate` builds a page from a prompt (`{ intent }`)
  when an AI provider is configured; the result is validated and saved as a
  draft for review.
- `DELETE /api/pages/:slug` removes a page.

Editing is closed by default. Set `PAGE_EDITOR_IDS` to a comma separated list
of Discord user ids to allow those users to edit pages. Reading a published
page is public.

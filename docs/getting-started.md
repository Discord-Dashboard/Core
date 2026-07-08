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
})
await dash.listen(3001)
```

## Any language (protocol mode)

Run `@discord-dashboard/core` as a service and connect your bot with an SDK.
See `examples/bot-dpy` for a Python bot that connects over the gateway.

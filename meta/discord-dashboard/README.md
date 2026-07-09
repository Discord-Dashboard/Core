# discord-dashboard

The batteries included way to add a web dashboard to a discord.js bot. One call
sets up OAuth, sessions, the settings API and an in process adapter. No license
server, no external services.

```js
import { Client, GatewayIntentBits } from "discord.js"
import { createDashboard, defineSettings, f } from "discord-dashboard"

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const settings = defineSettings((s) => ({
  general: s.category({
    name: "General",
    options: {
      prefix: f.text({ label: "Prefix", max: 3, default: "!" }),
      logChannel: f.channel({ types: ["text"] }),
      leveling: f.switch({ default: true }),
    },
  }),
}))

const dash = createDashboard({
  client,
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
  },
  settings,
})

await client.login(process.env.BOT_TOKEN)
await dash.listen(3001)
```

Scaffold a new project with `npm create discord-dashboard`. For bots in other
languages, run `@discord-dashboard/core` as a service and connect with an SDK.

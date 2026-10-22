# @asctane-dashboard/sdk-js

Connect a Node bot to the asctane-dashboard gateway.

```ts
import { Adapter, defineSettings, f } from "@asctane-dashboard/sdk-js"

const store = new Map()

const bot = new Adapter({
  botId: "my-bot",
  secret: process.env.DASHBOARD_SECRET,
  gateway: "wss://panel.example.com/gateway",
})
  .settings(
    defineSettings((s) => ({
      general: s.category({
        name: "General",
        options: { prefix: f.text({ max: 3 }) },
      }),
    }))
  )
  .onGet((guildId, key) => store.get(`${guildId}:${key}`) ?? null)
  .onSet((guildId, key, value) => store.set(`${guildId}:${key}`, value))
  .onAction((guildId, name, payload) => ({ guild: guildId, ran: name }))

bot.connect()
bot.push("setting.changed", { spaceId: "g", key: "general.prefix", value: "!" })
```

No inbound port is needed on the bot. The Python SDK mirrors this API.

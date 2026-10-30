# @acstane/sdk-js

Connect a Node bot to the @acstane/dashboard gateway.

```ts
import { Adapter, defineSettings, f } from "@acstane/sdk-js"

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
  .onGet((spaceId, key) => store.get(`${spaceId}:${key}`) ?? null)
  .onSet((spaceId, key, value) => store.set(`${spaceId}:${key}`, value))
  .onAction((spaceId, name, payload) => ({ space: spaceId, ran: name }))

bot.connect()
bot.push("setting.changed", { spaceId: "g", key: "general.prefix", value: "!" })
```

Handlers get the space id first and the platform id (such as `"discord"`)
last, so one bot can serve several platforms. No inbound port is needed on the
bot. The Python SDK mirrors this API.

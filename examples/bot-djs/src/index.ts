import { Adapter, defineSettings, f } from "@discord-dashboard/sdk-js"

// Tiny in memory store standing in for the bot database.
const store = new Map<string, unknown>()

const settings = defineSettings((s) => ({
  general: s.category({
    name: "General",
    options: {
      prefix: f.text({ label: "Prefix", max: 3, default: "!" }),
      logChannel: f.channel({ types: ["text"], label: "Log channel" }),
    },
  }),
}))

new Adapter({
  botId: process.env.BOT_ID ?? "example-bot",
  secret: process.env.DASHBOARD_SECRET ?? "dev-secret",
  gateway: process.env.GATEWAY ?? "ws://localhost:3001/gateway",
})
  .settings(settings)
  .onGet((guildId, key) => store.get(`${guildId}:${key}`) ?? null)
  .onSet((guildId, key, value) => {
    store.set(`${guildId}:${key}`, value)
  })
  .connect()

console.log("example discord.js bot connected to the dashboard gateway")

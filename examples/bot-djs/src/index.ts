import { Adapter, defineSettings, f } from "@asctane-dashboard/sdk-js"

// Tiny in memory store standing in for the bot database.
const store = new Map<string, unknown>()

const settings = defineSettings((s) => ({
  general: s.category({
    name: "General",
    options: {
      prefix: f.text({ label: "Prefix", max: 3, default: "!" }),
      logChannel: f.ref("channel", { filter: { types: ["text"] }, label: "Log channel" }),
    },
  }),
}))

new Adapter({
  botId: process.env.BOT_ID ?? "example-bot",
  secret: process.env.DASHBOARD_SECRET ?? "dev-secret",
  gateway: process.env.GATEWAY ?? "ws://localhost:3001/gateway",
})
  .settings(settings)
  .onGet((spaceId, key) => store.get(`${spaceId}:${key}`) ?? null)
  .onSet((spaceId, key, value) => {
    store.set(`${spaceId}:${key}`, value)
  })
  .connect()

console.log("example discord.js bot connected to the dashboard gateway")

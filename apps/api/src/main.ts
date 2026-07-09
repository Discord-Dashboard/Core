import { loadConfig } from "./config.js"
import { buildServer } from "./server.js"
import { startGateway } from "./gateway/gateway.js"
import { StatsRegistry, wireStats } from "./stats.js"
import { InProcessAdapter, MemoryStore } from "@discord-dashboard/core"
import { defineSettings } from "@discord-dashboard/schema"

// Standalone bootstrap. A real deployment injects a schema and adapter. This
// default keeps the server runnable for local development.
async function main() {
  const config = loadConfig()
  const def = defineSettings(() => ({}))
  const adapter = new InProcessAdapter(def, new MemoryStore())
  const stats = new StatsRegistry()
  const app = await buildServer(config, { def, adapter, stats })
  await app.listen({ port: config.port, host: "0.0.0.0" })

  const botId = process.env.BOT_ID
  const secret = process.env.DASHBOARD_SECRET
  const gateway = startGateway(app.server, async (id) =>
    id === botId ? secret ?? null : null
  )
  wireStats(gateway, stats)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

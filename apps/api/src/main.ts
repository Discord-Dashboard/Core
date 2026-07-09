import { createServer } from "node:http"
import { loadConfig } from "./config.js"
import { buildServer } from "./server.js"
import { startGateway } from "./gateway/gateway.js"
import { RemoteAdapter } from "./gateway/remote-adapter.js"
import { StatsRegistry, wireStats } from "./stats.js"
import { EventHub, wireEvents } from "./events-hub.js"
import {
  InProcessAdapter,
  MemoryStore,
  buildDefFromAdapter,
  type DefSource,
} from "@discord-dashboard/core"
import { defineSettings, type SettingsDef } from "@discord-dashboard/schema"

// Standalone bootstrap. Lite mode runs an in process demo adapter. Platform
// mode (BOT_ID set) proxies to a bot connected over the gateway and refreshes
// that bot's schema whenever it connects.
async function main() {
  const config = loadConfig()
  const stats = new StatsRegistry()
  const events = new EventHub()

  const botId = process.env.BOT_ID
  const secret = process.env.DASHBOARD_SECRET
  const gatewayPort = Number(process.env.GATEWAY_PORT ?? 3002)
  const gwServer = createServer()
  const gateway = startGateway(gwServer, async (id) =>
    id === botId ? secret ?? null : null
  )
  gwServer.listen(gatewayPort)
  wireStats(gateway, stats)
  wireEvents(gateway, events)

  let adapter
  let def: DefSource
  if (botId) {
    const remote = new RemoteAdapter(gateway, botId)
    adapter = remote
    let cached: SettingsDef = defineSettings(() => ({}))
    def = () => cached
    gateway.onConnect(async (id) => {
      if (id !== botId) return
      try {
        cached = await buildDefFromAdapter(remote)
      } catch {
        // The bot may not be ready yet; keep the previous schema.
      }
    })
  } else {
    const localDef = defineSettings(() => ({}))
    adapter = new InProcessAdapter(localDef, new MemoryStore())
    def = localDef
  }

  const app = await buildServer(config, { def, adapter, stats, events })
  await app.listen({ port: config.port, host: "0.0.0.0" })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

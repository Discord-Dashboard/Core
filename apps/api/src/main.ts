import { createServer } from "node:http"
import { loadConfig, validateConfig } from "./config.js"
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
  for (const warning of validateConfig(config)) console.warn(warning)
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

  // Users allowed to edit builder pages, by Discord id. Unset means nobody can,
  // so the page editor is closed until the operator opts specific people in.
  const editorIds = new Set(
    (process.env.PAGE_EDITOR_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  )

  const app = await buildServer(config, {
    def,
    adapter,
    stats,
    events,
    // This deployment serves a single bot; only its stats are readable, and
    // only to a logged in user. Multi tenant profiles swap in an owner lookup.
    botAccess: botId ? (_session, id) => id === botId : undefined,
    canEditPages: editorIds.size
      ? (session) => Boolean(session.userId && editorIds.has(session.userId))
      : undefined,
    // In platform mode we are ready once the bot has connected to the gateway.
    ready: botId ? () => gateway.sessions.has(botId) : undefined,
  })
  await app.listen({ port: config.port, host: "0.0.0.0" })

  // Drain cleanly on a deploy signal: stop the gateway and let in flight HTTP
  // requests finish before the process exits, instead of dropping connections.
  let shuttingDown = false
  const shutdown = async () => {
    if (shuttingDown) return
    shuttingDown = true
    try {
      gateway.close()
      gwServer.close()
      await app.close()
    } finally {
      process.exit(0)
    }
  }
  process.on("SIGTERM", shutdown)
  process.on("SIGINT", shutdown)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

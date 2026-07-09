import { describe, it, expect } from "vitest"
import { createServer } from "node:http"
import { startGateway } from "./gateway/gateway.js"
import { StatsRegistry, wireStats } from "./stats.js"
import { buildServer } from "./server.js"
import type { ApiConfig } from "./config.js"
import { InProcessAdapter, MemoryStore } from "@discord-dashboard/core"
import { Adapter, defineSettings } from "@discord-dashboard/sdk-js"

async function waitFor(check: () => boolean, ms = 4000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (check()) return
    await new Promise((r) => setTimeout(r, 25))
  }
  throw new Error("timeout")
}

const config: ApiConfig = {
  port: 0,
  cookieSecret: "test-secret-at-least-32-chars-long-000",
  allowedOrigins: ["http://localhost:3000"],
  discord: { clientId: "c", clientSecret: "s", redirectUri: "http://x/cb" },
}

describe("stats", () => {
  it("records stats pushed by a bot through the gateway", async () => {
    const server = createServer()
    const botId = "stat-bot"
    const secret = "stat-secret"
    const gateway = startGateway(server, async (id) => (id === botId ? secret : null))
    const registry = new StatsRegistry()
    wireStats(gateway, registry)
    await new Promise<void>((r) => server.listen(0, r))
    const port = (server.address() as { port: number }).port

    const bot = new Adapter({ botId, secret, gateway: `ws://127.0.0.1:${port}/gateway` })
      .settings(defineSettings(() => ({})))
    bot.connect()
    await waitFor(() => gateway.sessions.has(botId))
    bot.push("stats.push", { guilds: 5, users: 100 })
    await waitFor(() => registry.get(botId) !== null)

    expect(registry.get(botId)).toEqual({ guilds: 5, users: 100 })

    bot.disconnect()
    gateway.close()
    server.closeAllConnections?.()
    await new Promise<void>((r) => server.close(() => r()))
  })

  it("serves stats over http and 404s for unknown bots", async () => {
    const registry = new StatsRegistry()
    registry.record("b1", { guilds: 2, users: 50 })
    const def = defineSettings(() => ({}))
    const { SessionStore, SESSION_COOKIE } = await import("./auth/session.js")
    const sessions = new SessionStore()
    const sid = sessions.create()
    sessions.set(sid, { userId: "u1" })
    const cookie = `${SESSION_COOKIE}=${sid}`
    const app = await buildServer(config, {
      def,
      adapter: new InProcessAdapter(def, new MemoryStore()),
      stats: registry,
      sessions,
    })
    const ok = await app.inject({ method: "GET", url: "/api/bots/b1/stats", headers: { cookie } })
    expect(ok.json()).toEqual({ guilds: 2, users: 50 })
    const missing = await app.inject({ method: "GET", url: "/api/bots/nope/stats", headers: { cookie } })
    expect(missing.statusCode).toBe(404)
    const noauth = await app.inject({ method: "GET", url: "/api/bots/b1/stats" })
    expect(noauth.statusCode).toBe(401)
    await app.close()
  })
})

import { describe, it, expect } from "vitest"
import { createServer } from "node:http"
import type { FastifyInstance } from "fastify"
import { startGateway } from "./gateway/gateway.js"
import { EventHub, wireEvents } from "./events-hub.js"
import { RemoteAdapter } from "./gateway/remote-adapter.js"
import { buildServer } from "./server.js"
import type { ApiConfig } from "./config.js"
import { SessionStore, SESSION_COOKIE } from "./auth/session.js"
import { buildDefFromAdapter } from "@discord-dashboard/core"
import { Adapter, defineSettings, f } from "@discord-dashboard/sdk-js"

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

// The full platform path: an HTTP request, authorized against the session's
// guilds, is proxied through the RemoteAdapter over the gateway to a live bot
// written with the SDK, and its answer comes back the same way. This is the one
// test that exercises auth, the wire protocol and a real bot together.
describe("platform end to end", () => {
  it("round trips a setting through a live remote bot", async () => {
    const httpServer = createServer()
    const botId = "e2e-bot"
    const secret = "e2e-secret"
    const gateway = startGateway(httpServer, async (id) => (id === botId ? secret : null))
    const events = new EventHub()
    wireEvents(gateway, events)
    await new Promise<void>((r) => httpServer.listen(0, r))
    const port = (httpServer.address() as { port: number }).port

    // A real SDK bot that keeps settings in memory and announces changes.
    const store = new Map<string, unknown>()
    let setter: string | undefined
    const bot = new Adapter({ botId, secret, gateway: `ws://127.0.0.1:${port}/gateway` })
      .settings(
        defineSettings((s) => ({
          general: s.category({
            name: "General",
            options: { prefix: f.text({ max: 3, default: "!" }) },
          }),
        }))
      )
      .onGet((guildId, key) => store.get(`${guildId}:${key}`) ?? null)
      .onSet(async (guildId, key, value, actor) => {
        setter = actor?.userId
        store.set(`${guildId}:${key}`, value)
        await bot.push("setting.changed", { guildId, key, value })
      })
    bot.connect()
    await waitFor(() => gateway.sessions.has(botId))

    const remote = new RemoteAdapter(gateway, botId)
    // The dashboard learns the schema from the bot, exactly like production.
    const def = await buildDefFromAdapter(remote)

    const sessions = new SessionStore()
    const sid = sessions.create()
    sessions.set(sid, { userId: "u1", guilds: [{ id: "g", name: "G", icon: null }] })
    const cookie = `${SESSION_COOKIE}=${sid}`

    let app: FastifyInstance | undefined
    let received: unknown = null
    try {
      app = await buildServer(config, { def, adapter: remote, sessions, events })

      // Listen for the live event the bot will push on write.
      events.subscribe((e) => {
        received = e
      }, "g")

      // Write through the HTTP API, authorized for guild g.
      const set = await app.inject({
        method: "POST",
        url: "/api/guilds/g/settings/general/prefix",
        headers: { cookie, origin: "http://localhost:3000" },
        payload: { value: "ab" },
      })
      expect(set.statusCode).toBe(200)
      // The acting user's id travelled all the way to the bot.
      expect(setter).toBe("u1")

      // Read it back: the value made a full trip to the live bot and returned.
      const get = await app.inject({
        method: "GET",
        url: "/api/guilds/g/settings/general/prefix",
        headers: { cookie },
      })
      expect((get.json() as { value: unknown }).value).toBe("ab")

      // A user who does not manage guild g is refused.
      const forbidden = await app.inject({
        method: "GET",
        url: "/api/guilds/other/settings/general/prefix",
        headers: { cookie },
      })
      expect(forbidden.statusCode).toBe(403)

      // The bot's setting.changed reached the event hub.
      await waitFor(() => received !== null)
      expect((received as { method: string }).method).toBe("setting.changed")
    } finally {
      if (app) await app.close()
      bot.disconnect()
      gateway.close()
      httpServer.closeAllConnections?.()
      await new Promise<void>((r) => httpServer.close(() => r()))
    }
  })

  it("rejects a value that fails the bot's schema", async () => {
    const httpServer = createServer()
    const botId = "e2e-bot-2"
    const secret = "e2e-secret-2"
    const gateway = startGateway(httpServer, async (id) => (id === botId ? secret : null))
    await new Promise<void>((r) => httpServer.listen(0, r))
    const port = (httpServer.address() as { port: number }).port

    const store = new Map<string, unknown>()
    const bot = new Adapter({ botId, secret, gateway: `ws://127.0.0.1:${port}/gateway` })
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
    bot.connect()
    await waitFor(() => gateway.sessions.has(botId))

    const remote = new RemoteAdapter(gateway, botId)
    const def = await buildDefFromAdapter(remote)
    const sessions = new SessionStore()
    const sid = sessions.create()
    sessions.set(sid, { userId: "u1", guilds: [{ id: "g", name: "G", icon: null }] })
    const cookie = `${SESSION_COOKIE}=${sid}`

    let app: FastifyInstance | undefined
    try {
      app = await buildServer(config, { def, adapter: remote, sessions })
      // "toolong" exceeds max 3, so validation rejects it before it reaches the bot.
      const set = await app.inject({
        method: "POST",
        url: "/api/guilds/g/settings/general/prefix",
        headers: { cookie, origin: "http://localhost:3000" },
        payload: { value: "toolong" },
      })
      expect(set.statusCode).toBe(400)
      expect(store.size).toBe(0)
    } finally {
      if (app) await app.close()
      bot.disconnect()
      gateway.close()
      httpServer.closeAllConnections?.()
      await new Promise<void>((r) => httpServer.close(() => r()))
    }
  })
})

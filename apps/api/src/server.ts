import Fastify, { type FastifyError } from "fastify"
import cookie from "@fastify/cookie"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"
import type { BotAdapter } from "@discord-dashboard/core"
import type { SettingsDef } from "@discord-dashboard/schema"
import { createEntitlements } from "@discord-dashboard/billing"
import { PROTOCOL_VERSION } from "@discord-dashboard/protocol"
import type { ApiConfig } from "./config.js"
import { SessionStore } from "./auth/session.js"
import { registerAuthRoutes } from "./auth/routes.js"
import { registerSettingsRoutes } from "./routes/settings.js"
import { registerBillingRoutes } from "./routes/billing.js"
import { MemoryGrantStore } from "./billing.js"
import { StatsRegistry } from "./stats.js"
import { EventHub } from "./events-hub.js"
import { SESSION_COOKIE } from "./auth/session.js"

export interface ServerDeps {
  def: SettingsDef
  adapter: BotAdapter
  // Injectable for tests and for custom session backends.
  sessions?: SessionStore
  stats?: StatsRegistry
  events?: EventHub
}

export async function buildServer(config: ApiConfig, deps: ServerDeps) {
  const app = Fastify({ logger: true })
  const sessions = deps.sessions ?? new SessionStore()
  const grants = new MemoryGrantStore()
  const stats = deps.stats ?? new StatsRegistry()
  const events = deps.events ?? new EventHub()
  const entitlements = createEntitlements(grants)

  await app.register(helmet)
  await app.register(cookie, { secret: config.cookieSecret })
  await app.register(rateLimit, {
    max: config.rateLimit?.max ?? 100,
    timeWindow: config.rateLimit?.timeWindow ?? "1 minute",
  })
  await app.register(cors, { origin: config.allowedOrigins, credentials: true })

  // CSRF mitigation for cookie auth: a state changing request coming from a
  // browser carries an Origin header, and it must be an allowed origin.
  // Webhooks are server to server and exempt.
  const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"])
  app.addHook("onRequest", async (req, reply) => {
    if (!MUTATING.has(req.method)) return
    if (req.url.startsWith("/webhooks/")) return
    const origin = req.headers.origin
    if (origin && !config.allowedOrigins.includes(origin)) {
      return reply.code(403).send({ error: "bad origin" })
    }
  })

  app.get("/health", async () => ({ ok: true }))
  app.get("/version", async () => ({ protocol: PROTOCOL_VERSION }))
  app.get("/api/bots/:botId/stats", async (req, reply) => {
    const { botId } = req.params as { botId: string }
    const value = stats.get(botId)
    if (!value) return reply.code(404).send({ error: "no stats" })
    return value
  })

  // Server sent events: live setting changes for a guild.
  app.get("/api/guilds/:guildId/stream", (req, reply) => {
    const session = sessions.get(req.cookies[SESSION_COOKIE])
    if (!session?.userId) return reply.code(401).send({ error: "unauthorized" })
    const { guildId } = req.params as { guildId: string }
    reply.raw.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    })
    const off = events.subscribe(
      (e) => reply.raw.write(`data: ${JSON.stringify(e)}\n\n`),
      guildId
    )
    req.raw.on("close", off)
  })

  // Structured errors, and never leak internals to the client.
  app.setNotFoundHandler((_req, reply) => reply.code(404).send({ error: "not found" }))
  app.setErrorHandler((err: FastifyError, req, reply) => {
    req.log.error(err)
    reply.code(err.statusCode ?? 500).send({ error: "internal error" })
  })

  await registerAuthRoutes(app, config, sessions)
  await registerSettingsRoutes(app, {
    def: deps.def,
    adapter: deps.adapter,
    sessions,
    entitlements,
  })
  await registerBillingRoutes(app, grants)

  return app
}

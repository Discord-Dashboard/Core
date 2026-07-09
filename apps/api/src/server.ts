import Fastify, { type FastifyError } from "fastify"
import cookie from "@fastify/cookie"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"
import type { BotAdapter, DefSource } from "@discord-dashboard/core"
import { createEntitlements } from "@discord-dashboard/billing"
import { PROTOCOL_VERSION } from "@discord-dashboard/protocol"
import type { ApiConfig } from "./config.js"
import { SessionStore } from "./auth/session.js"
import { registerAuthRoutes } from "./auth/routes.js"
import { registerSettingsRoutes } from "./routes/settings.js"
import { registerBillingRoutes } from "./routes/billing.js"
import { registerPageRoutes } from "./routes/pages.js"
import { MemoryPageStore, type PageStore } from "./pages/store.js"
import type { LlmClient } from "@discord-dashboard/builder/ai"
import { MemoryGrantStore } from "./billing.js"
import { StatsRegistry } from "./stats.js"
import { EventHub } from "./events-hub.js"
import { AuditLog } from "./audit.js"
import {
  SESSION_COOKIE,
  canManageGuild,
  type SessionData,
} from "./auth/session.js"

export interface ServerDeps {
  def: DefSource
  adapter: BotAdapter
  // Injectable for tests and for custom session backends.
  sessions?: SessionStore
  stats?: StatsRegistry
  events?: EventHub
  audit?: AuditLog
  // Authorizes reading a bot's stats. Defaults to deny, so a bot's data is
  // never exposed to an arbitrary authenticated user who guesses its id.
  botAccess?: (session: SessionData, botId: string) => boolean | Promise<boolean>
  // Where builder pages live, and who may edit them. Editing defaults to deny.
  pages?: PageStore
  canEditPages?: (session: SessionData) => boolean | Promise<boolean>
  // Optional AI provider for the page generation endpoint.
  llm?: LlmClient
  // Readiness check for load balancers: for example, whether the bot is
  // connected. Defaults to always ready.
  ready?: () => boolean | Promise<boolean>
}

export async function buildServer(config: ApiConfig, deps: ServerDeps) {
  // Refuse to boot in production with a weak session secret. v2 shipped weak
  // defaults, this makes that mistake impossible in a real deployment.
  if (process.env.NODE_ENV === "production") {
    if (
      config.cookieSecret.length < 32 ||
      config.cookieSecret === "change-me-in-production"
    ) {
      throw new Error("set a strong COOKIE_SECRET (at least 32 characters)")
    }
  }

  // Cap request bodies to keep a single request from exhausting memory.
  const app = Fastify({ logger: true, bodyLimit: 256 * 1024 })
  const sessions = deps.sessions ?? new SessionStore()
  const grants = new MemoryGrantStore()
  const stats = deps.stats ?? new StatsRegistry()
  const events = deps.events ?? new EventHub()
  const pages = deps.pages ?? new MemoryPageStore()
  const audit = deps.audit ?? new AuditLog()
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

  // Collect every registered route so the OpenAPI document is derived from the
  // real server and never drifts from it.
  const routes: { method: string; url: string }[] = []
  app.addHook("onRoute", (r) => {
    const methods = Array.isArray(r.method) ? r.method : [r.method]
    for (const method of methods) {
      if (method === "HEAD" || method === "OPTIONS") continue
      routes.push({ method, url: r.url })
    }
  })

  // A minimal but always accurate OpenAPI 3.1 inventory of the endpoints.
  app.get("/openapi.json", async () => {
    const paths: Record<string, Record<string, unknown>> = {}
    for (const { method, url } of routes) {
      // Fastify uses :param, OpenAPI uses {param}.
      const openapiPath = url.replace(/:(\w+)/g, "{$1}")
      const entry = (paths[openapiPath] ??= {})
      entry[method.toLowerCase()] = {
        responses: { "200": { description: "OK" } },
      }
    }
    return {
      openapi: "3.1.0",
      info: { title: "discord-dashboard", version: PROTOCOL_VERSION },
      paths,
    }
  })

  app.get("/health", async () => ({ ok: true }))
  // Readiness: distinct from liveness. A load balancer should hold traffic until
  // this is ready (for example, until the bot has connected).
  app.get("/ready", async (_req, reply) => {
    const ready = deps.ready ? await deps.ready() : true
    if (!ready) return reply.code(503).send({ ready: false })
    return { ready: true }
  })
  app.get("/version", async () => ({ protocol: PROTOCOL_VERSION }))
  app.get("/api/bots/:botId/stats", async (req, reply) => {
    const session = sessions.get(req.cookies[SESSION_COOKIE])
    if (!session?.userId) return reply.code(401).send({ error: "unauthorized" })
    const { botId } = req.params as { botId: string }
    const allowed = deps.botAccess ? await deps.botAccess(session, botId) : false
    if (!allowed) return reply.code(403).send({ error: "no access to this bot" })
    const value = stats.get(botId)
    if (!value) return reply.code(404).send({ error: "no stats" })
    return value
  })

  // Server sent events: live setting changes for a guild.
  app.get("/api/guilds/:guildId/stream", (req, reply) => {
    const session = sessions.get(req.cookies[SESSION_COOKIE])
    if (!session?.userId) return reply.code(401).send({ error: "unauthorized" })
    const { guildId } = req.params as { guildId: string }
    if (!canManageGuild(session, guildId)) {
      return reply.code(403).send({ error: "no access to this guild" })
    }
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
    audit,
  })
  await registerBillingRoutes(app, grants, config.webhookSecret)
  await registerPageRoutes(app, {
    pages,
    sessions,
    canEditPages: deps.canEditPages,
    llm: deps.llm,
  })

  return app
}

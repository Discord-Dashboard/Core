import Fastify from "fastify"
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

export interface ServerDeps {
  def: SettingsDef
  adapter: BotAdapter
}

export async function buildServer(config: ApiConfig, deps: ServerDeps) {
  const app = Fastify({ logger: true })
  const sessions = new SessionStore()
  const grants = new MemoryGrantStore()
  const entitlements = createEntitlements(grants)

  await app.register(helmet)
  await app.register(cookie, { secret: config.cookieSecret })
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" })
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

  // Structured errors, and never leak internals to the client.
  app.setNotFoundHandler((_req, reply) => reply.code(404).send({ error: "not found" }))
  app.setErrorHandler((err, req, reply) => {
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

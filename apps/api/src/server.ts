import Fastify from "fastify"
import cookie from "@fastify/cookie"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"
import type { BotAdapter } from "@discord-dashboard/core"
import type { SettingsDef } from "@discord-dashboard/schema"
import { createEntitlements } from "@discord-dashboard/billing"
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

  app.get("/health", async () => ({ ok: true }))

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

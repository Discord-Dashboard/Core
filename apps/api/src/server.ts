import Fastify from "fastify"
import cookie from "@fastify/cookie"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"
import type { ApiConfig } from "./config.js"
import { registerSettingsRoutes } from "./routes/settings.js"

// Security is on by default here, unlike v2 where it was opt in.
export async function buildServer(config: ApiConfig) {
  const app = Fastify({ logger: true })

  await app.register(helmet)
  await app.register(cookie, { secret: config.cookieSecret })
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" })
  await app.register(cors, {
    origin: config.allowedOrigins,
    credentials: true,
  })

  app.get("/health", async () => ({ ok: true }))

  await registerSettingsRoutes(app)

  return app
}

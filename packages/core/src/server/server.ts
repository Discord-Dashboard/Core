import Fastify, { type FastifyError } from "fastify"
import cookie from "@fastify/cookie"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"
import fastifyStatic from "@fastify/static"
import type { BotAdapter, DefSource } from "../base.js"
import { createEntitlements } from "../billing/index.js"
import { PROTOCOL_VERSION } from "@acstane/protocol"
import type { ApiConfig } from "./config.js"
import { SessionStore } from "./auth/session.js"
import { registerAuthRoutes } from "./auth/routes.js"
import { registerSettingsRoutes } from "./routes/settings.js"
import { registerBillingRoutes } from "./routes/billing.js"
import { registerPageRoutes } from "./routes/pages.js"
import { MemoryPageStore, type PageStore } from "./pages/store.js"
import type { LlmClient } from "@acstane/builder/ai"
import { MemoryGrantStore } from "./billing.js"
import { StatsRegistry } from "./stats.js"
import { EventHub } from "./events-hub.js"
import { AuditLog } from "./audit.js"
import {
  SESSION_COOKIE,
  canManageSpace,
  type SessionData,
} from "./auth/session.js"

// How often an idle live stream gets a keep-alive comment.
const SSE_HEARTBEAT_MS = 25_000

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
  // Extra gauges to expose on /metrics, for example the connected bot count.
  metrics?: () => Record<string, number>
  // Serves a prebuilt web app (a static export, such as webRoot from
  // @acstane/web) from this directory, on the API's own origin.
  web?: { root: string }
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

  await app.register(helmet, {
    contentSecurityPolicy: deps.web
      ? {
          directives: {
            // The exported pages hydrate from inline scripts, and avatars and
            // icons come from the platform's CDN.
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            // Same origin assets must still load on a plain http deployment.
            upgradeInsecureRequests: null,
          },
        }
      : undefined,
  })
  await app.register(cookie, { secret: config.cookieSecret })
  await app.register(rateLimit, {
    max: config.rateLimit?.max ?? 100,
    timeWindow: config.rateLimit?.timeWindow ?? "1 minute",
  })
  await app.register(cors, { origin: config.allowedOrigins, credentials: true })

  // CSRF mitigation for cookie auth: a state changing request coming from a
  // browser carries an Origin header, and it must be this server's own origin
  // or an allowed one. Webhooks are server to server and exempt.
  const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"])
  app.addHook("onRequest", async (req, reply) => {
    if (!MUTATING.has(req.method)) return
    if (req.url.startsWith("/api/webhooks/")) return
    const origin = req.headers.origin
    if (
      origin &&
      !config.allowedOrigins.includes(origin) &&
      !sameOrigin(origin, req.headers.host)
    ) {
      return reply.code(403).send({ error: "bad origin" })
    }
  })

  // Collect every registered route so the OpenAPI document is derived from the
  // real server and never drifts from it.
  const routes: { method: string; url: string }[] = []
  app.addHook("onRoute", (r) => {
    // The web app's catch all file route is not part of the API.
    if (r.url.endsWith("*")) return
    const methods = Array.isArray(r.method) ? r.method : [r.method]
    for (const method of methods) {
      if (method === "HEAD" || method === "OPTIONS") continue
      routes.push({ method, url: r.url })
    }
  })

  // A minimal but always accurate OpenAPI 3.1 inventory of the endpoints.
  app.get("/api/openapi.json", async () => {
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
      info: { title: "@acstane/dashboard", version: PROTOCOL_VERSION },
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
  app.get("/api/version", async () => ({ protocol: PROTOCOL_VERSION }))
  // Prometheus style gauges for platform observability. Kept coarse so it leaks
  // no per user data.
  app.get("/metrics", async (_req, reply) => {
    const gauges: Record<string, number> = {
      dd_up: 1,
      dd_sessions: sessions.size,
      ...(deps.metrics ? deps.metrics() : {}),
    }
    reply.header("content-type", "text/plain; version=0.0.4")
    return (
      Object.entries(gauges)
        .map(([name, value]) => `${name} ${value}`)
        .join("\n") + "\n"
    )
  })
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

  // Server sent events: live setting changes for a space.
  app.get("/api/spaces/:platform/:spaceId/stream", (req, reply) => {
    const session = sessions.get(req.cookies[SESSION_COOKIE])
    if (!session?.userId) return reply.code(401).send({ error: "unauthorized" })
    const { platform, spaceId } = req.params as { platform: string; spaceId: string }
    if (!canManageSpace(session, platform, spaceId)) {
      return reply.code(403).send({ error: "no access to this space" })
    }
    // The stream is written by hand, so Fastify must not send a reply of its own.
    reply.hijack()
    reply.raw.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      // Stops nginx and similar proxies from buffering the stream.
      "x-accel-buffering": "no",
    })
    reply.raw.flushHeaders()
    // A browser only reports the stream as open once bytes arrive, so send a
    // comment straight away, then one every so often so idle proxies and load
    // balancers keep the connection.
    reply.raw.write(": connected\n\n")
    const heartbeat = setInterval(() => reply.raw.write(": ping\n\n"), SSE_HEARTBEAT_MS)
    heartbeat.unref?.()
    const off = events.subscribe(
      (e) => reply.raw.write(`data: ${JSON.stringify(e)}\n\n`),
      spaceId
    )
    req.raw.on("close", () => {
      clearInterval(heartbeat)
      off()
    })
  })

  // The web app's pages and assets. A route is a folder with an index.html,
  // so /manage is served from manage/index.html. A flat export works too:
  // /manage falls back to manage.html.
  if (deps.web) {
    await app.register(fastifyStatic, {
      root: deps.web.root,
      extensions: ["html"],
      // Next.js hashes these file names, so they can be cached for good.
      setHeaders: (reply, file) => {
        if (/[\\/]_next[\\/]static[\\/]/.test(file)) {
          reply.header("cache-control", "public, max-age=31536000, immutable")
        }
      },
    })
  }

  // Structured errors, and never leak internals to the client. A browser
  // asking for a page that does not exist gets the web app's 404 page.
  app.setNotFoundHandler((req, reply) => {
    if (deps.web && req.method === "GET" && !req.url.startsWith("/api/")) {
      return reply.code(404).type("text/html").sendFile("404.html")
    }
    return reply.code(404).send({ error: "not found" })
  })
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
    events,
    platforms: config.platforms,
  })
  await registerBillingRoutes(
    app,
    grants,
    { stripeWebhookSecret: config.stripeWebhookSecret, webhookSecret: config.webhookSecret },
    config.platforms
  )
  await registerPageRoutes(app, {
    pages,
    sessions,
    canEditPages: deps.canEditPages,
    llm: deps.llm,
  })

  return app
}

// Whether an Origin header names the host the request was sent to, as it does
// when the web app is served by this server.
function sameOrigin(origin: string, host: string | undefined): boolean {
  if (!host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

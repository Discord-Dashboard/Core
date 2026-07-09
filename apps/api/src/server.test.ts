import { describe, it, expect, beforeAll, afterAll } from "vitest"
import type { FastifyInstance } from "fastify"
import { buildServer } from "./server.js"
import type { ApiConfig } from "./config.js"
import { InProcessAdapter, MemoryStore } from "@discord-dashboard/core"
import { defineSettings, f } from "@discord-dashboard/schema"

const config: ApiConfig = {
  port: 0,
  cookieSecret: "test-secret-at-least-32-chars-long-000",
  allowedOrigins: ["http://localhost:3000"],
  discord: { clientId: "c", clientSecret: "s", redirectUri: "http://localhost/cb" },
}

const def = defineSettings((s) => ({
  general: s.category({
    name: "General",
    options: { prefix: f.text({ max: 3 }) },
  }),
}))

describe("api server (integration)", () => {
  let app: FastifyInstance

  beforeAll(async () => {
    const adapter = new InProcessAdapter(def, new MemoryStore())
    app = await buildServer(config, { def, adapter })
  })
  afterAll(async () => {
    await app.close()
  })

  it("responds on health", async () => {
    const res = await app.inject({ method: "GET", url: "/health" })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ ok: true })
  })

  it("is ready by default and honors a readiness check", async () => {
    // Default: always ready.
    const def1 = await app.inject({ method: "GET", url: "/ready" })
    expect(def1.statusCode).toBe(200)

    const notReady = await buildServer(config, {
      def,
      adapter: new InProcessAdapter(def, new MemoryStore()),
      ready: () => false,
    })
    const res = await notReady.inject({ method: "GET", url: "/ready" })
    expect(res.statusCode).toBe(503)
    await notReady.close()
  })

  it("exposes prometheus metrics", async () => {
    const res = await app.inject({ method: "GET", url: "/metrics" })
    expect(res.statusCode).toBe(200)
    expect(res.headers["content-type"]).toContain("text/plain")
    expect(res.body).toContain("dd_up 1")
    expect(res.body).toMatch(/dd_sessions \d+/)
  })

  it("serves an openapi inventory derived from the routes", async () => {
    const res = await app.inject({ method: "GET", url: "/openapi.json" })
    expect(res.statusCode).toBe(200)
    const doc = res.json() as {
      openapi: string
      paths: Record<string, Record<string, unknown>>
    }
    expect(doc.openapi).toBe("3.1.0")
    // Fastify :params are rendered as OpenAPI {params}.
    expect(doc.paths["/api/guilds/{guildId}/values"]?.get).toBeDefined()
    expect(doc.paths["/api/pages/{slug}"]?.post).toBeDefined()
  })

  it("serves the schema descriptor", async () => {
    const res = await app.inject({ method: "GET", url: "/api/schema" })
    expect(res.statusCode).toBe(200)
    expect(res.json().categories[0].id).toBe("general")
  })

  it("rejects an unauthenticated settings write", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/guilds/g/settings/general/prefix",
      payload: { value: "!" },
    })
    expect(res.statusCode).toBe(401)
  })

  it("accepts a discord entitlement webhook", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/webhooks/discord",
      payload: { guild_id: "g", sku_id: "pro" },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ received: true })
  })
})

import { describe as d2, it as i2, expect as e2, beforeAll as b2, afterAll as a2 } from "vitest"
import { buildServer as build2 } from "./server.js"
import { InProcessAdapter as IPA2, MemoryStore as MS2 } from "@discord-dashboard/core"
import { defineSettings as ds2 } from "@discord-dashboard/schema"

d2("api robustness", () => {
  let app2: import("fastify").FastifyInstance
  const cfg2 = {
    port: 0,
    cookieSecret: "test-secret-at-least-32-chars-long-000",
    allowedOrigins: ["http://localhost:3000"],
    discord: { clientId: "c", clientSecret: "s", redirectUri: "http://localhost/cb" },
  }
  const def2 = ds2(() => ({}))
  b2(async () => {
    app2 = await build2(cfg2, { def: def2, adapter: new IPA2(def2, new MS2()) })
  })
  a2(async () => {
    await app2.close()
  })
  i2("returns a json 404 for unknown routes", async () => {
    const res = await app2.inject({ method: "GET", url: "/nope" })
    e2(res.statusCode).toBe(404)
    e2(res.json()).toEqual({ error: "not found" })
  })
  i2("exposes the protocol version", async () => {
    const res = await app2.inject({ method: "GET", url: "/version" })
    e2(res.statusCode).toBe(200)
    e2((res.json() as { protocol: string }).protocol).toMatch(/^\d+\.\d+\.\d+$/)
  })
})

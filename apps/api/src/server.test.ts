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

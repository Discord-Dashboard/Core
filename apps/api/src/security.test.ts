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
  general: s.category({ name: "General", options: { prefix: f.text({ max: 3 }) } }),
}))

describe("security", () => {
  let app: FastifyInstance
  beforeAll(async () => {
    app = await buildServer(config, {
      def,
      adapter: new InProcessAdapter(def, new MemoryStore()),
    })
  })
  afterAll(async () => {
    await app.close()
  })

  it("rejects a mutating request from a disallowed origin", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/guilds/g/settings/general/prefix",
      headers: { origin: "https://evil.example" },
      payload: { value: "!" },
    })
    expect(res.statusCode).toBe(403)
  })

  it("allows an allowed origin through to auth", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/guilds/g/settings/general/prefix",
      headers: { origin: "http://localhost:3000" },
      payload: { value: "!" },
    })
    expect(res.statusCode).toBe(401)
  })

  it("exempts webhooks from the origin check", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/webhooks/discord",
      headers: { origin: "https://discord.com" },
      payload: { guild_id: "g", sku_id: "pro" },
    })
    expect(res.statusCode).toBe(200)
  })

  it("sets security headers from helmet", async () => {
    const res = await app.inject({ method: "GET", url: "/health" })
    expect(res.headers["x-content-type-options"]).toBe("nosniff")
  })

  it("advertises rate limit headers", async () => {
    const res = await app.inject({ method: "GET", url: "/health" })
    expect(res.headers["x-ratelimit-limit"]).toBeDefined()
  })
})

import { describe as d3, it as i3, expect as e3 } from "vitest"
import { buildServer as build3 } from "./server.js"
import { InProcessAdapter as IPA3, MemoryStore as MS3 } from "@discord-dashboard/core"
import { defineSettings as ds3 } from "@discord-dashboard/schema"

d3("rate limiting", () => {
  i3("returns 429 once the limit is exceeded", async () => {
    const def3 = ds3(() => ({}))
    const app3 = await build3(
      {
        port: 0,
        cookieSecret: "test-secret-at-least-32-chars-long-000",
        allowedOrigins: ["http://localhost:3000"],
        discord: { clientId: "c", clientSecret: "s", redirectUri: "http://x/cb" },
        rateLimit: { max: 2, timeWindow: "1 minute" },
      },
      { def: def3, adapter: new IPA3(def3, new MS3()) }
    )
    const codes: number[] = []
    for (let i = 0; i < 3; i++) {
      const res = await app3.inject({ method: "GET", url: "/health" })
      codes.push(res.statusCode)
    }
    e3(codes.filter((c) => c === 429).length).toBeGreaterThanOrEqual(1)
    await app3.close()
  })
})

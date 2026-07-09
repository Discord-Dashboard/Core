import { describe, it, expect, beforeAll, afterAll } from "vitest"
import type { FastifyInstance } from "fastify"
import { buildServer } from "./server.js"
import type { ApiConfig } from "./config.js"
import { InProcessAdapter, MemoryStore } from "@discord-dashboard/core"
import { defineSettings } from "@discord-dashboard/schema"

const def = defineSettings(() => ({}))
const config: ApiConfig = {
  port: 0,
  cookieSecret: "test-secret-at-least-32-chars-long-000",
  allowedOrigins: ["http://localhost:3000"],
  discord: { clientId: "c", clientSecret: "s", redirectUri: "http://x/cb" },
  webhookSecret: "hook-secret",
}

describe("webhook authentication", () => {
  let app: FastifyInstance
  beforeAll(async () => {
    app = await buildServer(config, { def, adapter: new InProcessAdapter(def, new MemoryStore()) })
  })
  afterAll(async () => {
    await app.close()
  })

  it("rejects a webhook without the secret", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/webhooks/discord",
      payload: { guild_id: "g", sku_id: "pro" },
    })
    expect(res.statusCode).toBe(401)
  })

  it("accepts a webhook with the correct secret", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/webhooks/discord",
      headers: { "x-webhook-secret": "hook-secret" },
      payload: { guild_id: "g", sku_id: "pro" },
    })
    expect(res.statusCode).toBe(200)
  })
})

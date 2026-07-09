import { describe, it, expect, beforeAll, afterAll } from "vitest"
import type { FastifyInstance } from "fastify"
import { buildServer } from "./server.js"
import type { ApiConfig } from "./config.js"
import { SessionStore, SESSION_COOKIE } from "./auth/session.js"
import { InProcessAdapter, MemoryStore } from "@discord-dashboard/core"
import { defineSettings, f } from "@discord-dashboard/schema"

const config: ApiConfig = {
  port: 0,
  cookieSecret: "test-secret-at-least-32-chars-long-000",
  allowedOrigins: ["http://localhost:3000"],
  discord: { clientId: "c", clientSecret: "s", redirectUri: "http://x/cb" },
}
const def = defineSettings((s) => ({
  pro: s.category({
    name: "Pro",
    entitlement: "pro",
    options: { color: f.text() },
  }),
}))
const origin = "http://localhost:3000"

describe("monetization gating over http", () => {
  let app: FastifyInstance
  let cookie: string
  beforeAll(async () => {
    const sessions = new SessionStore()
    const sid = sessions.create()
    sessions.set(sid, { userId: "u1" })
    cookie = `${SESSION_COOKIE}=${sid}`
    app = await buildServer(config, {
      def,
      adapter: new InProcessAdapter(def, new MemoryStore()),
      sessions,
    })
  })
  afterAll(async () => {
    await app.close()
  })

  it("blocks a gated write without entitlement, then allows it after a grant", async () => {
    const write = () =>
      app.inject({
        method: "POST",
        url: "/api/guilds/g/settings/pro/color",
        headers: { origin, cookie },
        payload: { value: "red" },
      })

    const before = await write()
    expect(before.statusCode).toBe(400)
    expect((before.json() as { error?: string }).error).toContain("entitlement")

    const grant = await app.inject({
      method: "POST",
      url: "/webhooks/discord",
      payload: { guild_id: "g", sku_id: "pro" },
    })
    expect(grant.statusCode).toBe(200)

    const after = await write()
    expect(after.statusCode).toBe(200)
    expect((after.json() as { ok: boolean }).ok).toBe(true)
  })
})

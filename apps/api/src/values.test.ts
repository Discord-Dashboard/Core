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
  general: s.category({
    name: "General",
    options: {
      prefix: f.text({ max: 3, default: "!" }),
      leveling: f.switch({ default: true }),
    },
  }),
}))

describe("bulk values", () => {
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

  it("returns all values with defaults applied", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/guilds/g/values",
      headers: { cookie },
    })
    expect(res.statusCode).toBe(200)
    const { values } = res.json() as { values: Record<string, unknown> }
    expect(values["general.prefix"]).toBe("!")
    expect(values["general.leveling"]).toBe(true)
  })

  it("requires authentication", async () => {
    const res = await app.inject({ method: "GET", url: "/api/guilds/g/values" })
    expect(res.statusCode).toBe(401)
  })
})

import { describe, it, expect, beforeAll, afterAll } from "vitest"
import type { FastifyInstance } from "fastify"
import { buildServer } from "./server.js"
import type { ApiConfig } from "./config.js"
import { SessionStore, SESSION_COOKIE } from "./auth/session.js"
import { InProcessAdapter, MemoryStore } from "@discord-dashboard/core"
import { defineSettings, f, type SettingsDef } from "@discord-dashboard/schema"

const config: ApiConfig = {
  port: 0,
  cookieSecret: "test-secret-at-least-32-chars-long-000",
  allowedOrigins: ["http://localhost:3000"],
  discord: { clientId: "c", clientSecret: "s", redirectUri: "http://x/cb" },
}

describe("server with a dynamic def provider", () => {
  let app: FastifyInstance
  let cookie: string
  let current: SettingsDef = defineSettings(() => ({}))
  beforeAll(async () => {
    const sessions = new SessionStore()
    const sid = sessions.create()
    sessions.set(sid, { userId: "u1", guilds: [{ id: "g", name: "G", icon: null }] })
    cookie = `${SESSION_COOKIE}=${sid}`
    app = await buildServer(config, {
      def: () => current,
      adapter: new InProcessAdapter(defineSettings(() => ({})), new MemoryStore()),
      sessions,
    })
  })
  afterAll(async () => {
    await app.close()
  })

  it("reflects the current provider schema in bulk values", async () => {
    const empty = await app.inject({ method: "GET", url: "/api/guilds/g/values", headers: { cookie } })
    expect(empty.json()).toEqual({ values: {} })

    current = defineSettings((s) => ({
      general: s.category({ name: "General", options: { prefix: f.text({ default: "!" }) } }),
    }))
    const after = await app.inject({ method: "GET", url: "/api/guilds/g/values", headers: { cookie } })
    expect((after.json() as { values: Record<string, unknown> }).values["general.prefix"]).toBe("!")
  })
})

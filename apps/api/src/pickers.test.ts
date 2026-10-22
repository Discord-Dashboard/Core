import { describe, it, expect, beforeAll, afterAll } from "vitest"
import type { FastifyInstance } from "fastify"
import { buildServer } from "./server.js"
import type { ApiConfig } from "./config.js"
import { SessionStore, SESSION_COOKIE } from "./auth/session.js"
import { InProcessAdapter, MemoryStore, type SpaceSource } from "@discord-dashboard/core"
import { defineSettings } from "@discord-dashboard/schema"
import { discord } from "@discord-dashboard/platform-discord"

const config: ApiConfig = {
  port: 0,
  cookieSecret: "test-secret-at-least-32-chars-long-000",
  allowedOrigins: ["http://localhost:3000"],
  platforms: [discord({ clientId: "c", clientSecret: "s", redirectUri: "http://x/cb" })],
}
const def = defineSettings(() => ({}))

const source: SpaceSource = {
  async resources(_spaceId, kind) {
    if (kind === "channel") return [{ label: "general", value: "c1" }]
    return [{ label: "mod", value: "r1" }]
  },
  async memberPermissions() {
    return []
  },
}

describe("picker endpoints", () => {
  let app: FastifyInstance
  let cookie: string
  beforeAll(async () => {
    const sessions = new SessionStore()
    const sid = sessions.create()
    sessions.set(sid, { userId: "u1", guilds: [{ id: "g", name: "G", icon: null }] })
    cookie = `${SESSION_COOKIE}=${sid}`
    app = await buildServer(config, {
      def,
      adapter: new InProcessAdapter(def, new MemoryStore(), source),
      sessions,
    })
  })
  afterAll(async () => {
    await app.close()
  })

  it("lists channels", async () => {
    const res = await app.inject({ method: "GET", url: "/api/guilds/g/channels", headers: { cookie } })
    expect(res.statusCode).toBe(200)
    expect((res.json() as { channels: unknown[] }).channels).toEqual([
      { label: "general", value: "c1" },
    ])
  })
  it("lists roles", async () => {
    const res = await app.inject({ method: "GET", url: "/api/guilds/g/roles", headers: { cookie } })
    expect((res.json() as { roles: { value: string }[] }).roles[0]?.value).toBe("r1")
  })
  it("requires auth", async () => {
    const res = await app.inject({ method: "GET", url: "/api/guilds/g/channels" })
    expect(res.statusCode).toBe(401)
  })
})

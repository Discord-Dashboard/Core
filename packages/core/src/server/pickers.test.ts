import { describe, it, expect, beforeAll, afterAll } from "vitest"
import type { FastifyInstance } from "fastify"
import { buildServer } from "./server.js"
import type { ApiConfig } from "./config.js"
import { SessionStore, SESSION_COOKIE } from "./auth/session.js"
import { InProcessAdapter, MemoryStore, type SpaceSource } from "../base.js"
import { defineSettings } from "@acstane/schema"
import { discord } from "@acstane/platform-discord"

const config: ApiConfig = {
  port: 0,
  cookieSecret: "test-secret-at-least-32-chars-long-000",
  allowedOrigins: ["http://localhost:3000"],
  platforms: [discord({ clientId: "c", clientSecret: "s", redirectUri: "http://x/cb" })],
}
const def = defineSettings(() => ({}))

const source: SpaceSource = {
  async resources(_spaceId, kind, filter) {
    if (kind === "channel") {
      const nsfw = (filter as { onlyNsfw?: boolean } | undefined)?.onlyNsfw
      return nsfw ? [] : [{ label: "general", value: "c1" }]
    }
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
    sessions.set(sid, { userId: "u1", platform: "discord", spaces: [{ id: "g", name: "G", icon: null }] })
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
    const res = await app.inject({ method: "GET", url: "/api/spaces/discord/g/channels", headers: { cookie } })
    expect(res.statusCode).toBe(200)
    expect((res.json() as { channels: unknown[] }).channels).toEqual([
      { label: "general", value: "c1" },
    ])
  })
  it("lists roles", async () => {
    const res = await app.inject({ method: "GET", url: "/api/spaces/discord/g/roles", headers: { cookie } })
    expect((res.json() as { roles: { value: string }[] }).roles[0]?.value).toBe("r1")
  })
  it("lists any ref kind the platform has, with the field's filter", async () => {
    const roles = await app.inject({ method: "GET", url: "/api/spaces/discord/g/resources/role", headers: { cookie } })
    expect((roles.json() as { items: { value: string }[] }).items[0]?.value).toBe("r1")
    const filter = encodeURIComponent(JSON.stringify({ onlyNsfw: true }))
    const nsfw = await app.inject({
      method: "GET",
      url: `/api/spaces/discord/g/resources/channel?filter=${filter}`,
      headers: { cookie },
    })
    expect((nsfw.json() as { items: unknown[] }).items).toEqual([])
  })
  it("rejects a kind the platform does not have, or a bad filter", async () => {
    const thread = await app.inject({ method: "GET", url: "/api/spaces/discord/g/resources/emoji", headers: { cookie } })
    expect(thread.statusCode).toBe(404)
    const bad = await app.inject({
      method: "GET",
      url: "/api/spaces/discord/g/resources/channel?filter=nope",
      headers: { cookie },
    })
    expect(bad.statusCode).toBe(400)
  })
  it("lists the platforms to log in with", async () => {
    const res = await app.inject({ method: "GET", url: "/api/platforms" })
    expect(res.json()).toEqual({ platforms: [{ id: "discord", name: "Discord" }] })
  })
  it("requires auth", async () => {
    const res = await app.inject({ method: "GET", url: "/api/spaces/discord/g/channels" })
    expect(res.statusCode).toBe(401)
  })
})

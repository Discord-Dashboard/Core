import { describe, it, expect } from "vitest"
import type { FastifyInstance } from "fastify"
import { AuditLog } from "./audit.js"
import { buildServer } from "./server.js"
import type { ApiConfig } from "./config.js"
import { SessionStore, SESSION_COOKIE } from "./auth/session.js"
import { InProcessAdapter, MemoryStore } from "@discord-dashboard/core"
import { defineSettings, f } from "@discord-dashboard/schema"

describe("AuditLog", () => {
  it("returns a guild's entries newest first", () => {
    let t = 0
    const log = new AuditLog(1000, () => ++t)
    log.record({ guildId: "g", userId: "u1", key: "a.b", value: 1 })
    log.record({ guildId: "other", userId: "u2", key: "a.b", value: 9 })
    log.record({ guildId: "g", userId: "u1", key: "a.b", value: 2 })
    const entries = log.list("g")
    expect(entries.map((e) => e.value)).toEqual([2, 1])
    expect(entries.every((e) => e.guildId === "g")).toBe(true)
  })
  it("keeps only the most recent entries up to the limit", () => {
    const log = new AuditLog(2, () => 0)
    for (let i = 0; i < 5; i++) log.record({ guildId: "g", userId: "u", key: "k", value: i })
    expect(log.list("g").map((e) => e.value)).toEqual([4, 3])
  })
})

const config: ApiConfig = {
  port: 0,
  cookieSecret: "test-secret-at-least-32-chars-long-000",
  allowedOrigins: ["http://localhost:3000"],
  discord: { clientId: "c", clientSecret: "s", redirectUri: "http://x/cb" },
}
const def = defineSettings((s) => ({
  general: s.category({ name: "General", options: { prefix: f.text({ max: 3 }) } }),
}))

describe("audit over http", () => {
  let app: FastifyInstance
  let cookie: string

  it("records a setting change and exposes it to a guild manager", async () => {
    const sessions = new SessionStore()
    const sid = sessions.create()
    sessions.set(sid, { userId: "u1", guilds: [{ id: "g", name: "G", icon: null }] })
    cookie = `${SESSION_COOKIE}=${sid}`
    app = await buildServer(config, {
      def,
      adapter: new InProcessAdapter(def, new MemoryStore()),
      sessions,
    })

    await app.inject({
      method: "POST",
      url: "/api/guilds/g/settings/general/prefix",
      headers: { origin: "http://localhost:3000", cookie },
      payload: { value: "!" },
    })

    const res = await app.inject({
      method: "GET",
      url: "/api/guilds/g/audit",
      headers: { cookie },
    })
    expect(res.statusCode).toBe(200)
    const { entries } = res.json() as {
      entries: { userId: string; key: string; value: unknown }[]
    }
    expect(entries).toHaveLength(1)
    expect(entries[0]!.userId).toBe("u1")
    expect(entries[0]!.key).toBe("general.prefix")
    expect(entries[0]!.value).toBe("!")

    // A user who does not manage the guild cannot read its audit trail.
    const other = await app.inject({ method: "GET", url: "/api/guilds/nope/audit", headers: { cookie } })
    expect(other.statusCode).toBe(403)
    await app.close()
  })
})

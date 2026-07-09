import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import type { FastifyInstance } from "fastify"
import { buildServer } from "./server.js"
import type { ApiConfig } from "./config.js"
import { InProcessAdapter, MemoryStore } from "@discord-dashboard/core"
import { defineSettings } from "@discord-dashboard/schema"

const config: ApiConfig = {
  port: 0,
  cookieSecret: "test-secret-at-least-32-chars-long-000",
  allowedOrigins: ["http://localhost:3000"],
  discord: { clientId: "cid", clientSecret: "sec", redirectUri: "http://localhost:3001/auth/callback" },
}
const def = defineSettings(() => ({}))

function cookieValue(setCookie: string | string[] | undefined): string {
  const raw = Array.isArray(setCookie) ? setCookie[0]! : setCookie ?? ""
  return raw.split(";")[0]!
}

describe("oauth flow", () => {
  let app: FastifyInstance
  beforeAll(async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const u = String(url)
        if (u.includes("/oauth2/token")) {
          return new Response(JSON.stringify({ access_token: "tok" }), { status: 200 })
        }
        if (u.includes("/users/@me/guilds")) {
          return new Response(
            JSON.stringify([
              { id: "g1", name: "Owned", owner: true, permissions: "0" },
              { id: "g2", name: "Manager", owner: false, permissions: "32" },
              { id: "g3", name: "Member", owner: false, permissions: "0" },
            ]),
            { status: 200 }
          )
        }
        if (u.includes("/users/@me")) {
          return new Response(
            JSON.stringify({ id: "u1", username: "bob", avatar: null }),
            { status: 200 }
          )
        }
        return new Response("{}", { status: 404 })
      })
    )
    app = await buildServer(config, {
      def,
      adapter: new InProcessAdapter(def, new MemoryStore()),
    })
  })
  afterAll(async () => {
    vi.unstubAllGlobals()
    await app.close()
  })

  it("logs a user in via the discord callback", async () => {
    const start = await app.inject({ method: "GET", url: "/auth/discord" })
    expect(start.statusCode).toBe(302)
    const cookie = cookieValue(start.headers["set-cookie"])
    const location = String(start.headers["location"])
    expect(location).toContain("code_challenge_method=S256")
    const state = new URL(location).searchParams.get("state")!

    const cb = await app.inject({
      method: "GET",
      url: `/auth/callback?code=abc&state=${state}`,
      headers: { cookie },
    })
    expect(cb.statusCode).toBe(302)

    const me = await app.inject({ method: "GET", url: "/auth/me", headers: { cookie } })
    expect(me.statusCode).toBe(200)
    expect((me.json() as { id: string }).id).toBe("u1")

    const guilds = await app.inject({ method: "GET", url: "/api/guilds", headers: { cookie } })
    const list = (guilds.json() as { guilds: { id: string }[] }).guilds
    // Only the owned and Manage Server guilds, not the plain member one.
    expect(list.map((g) => g.id).sort()).toEqual(["g1", "g2"])
  })

  it("rejects a callback with a mismatched state", async () => {
    const start = await app.inject({ method: "GET", url: "/auth/discord" })
    const cookie = cookieValue(start.headers["set-cookie"])
    const cb = await app.inject({
      method: "GET",
      url: "/auth/callback?code=abc&state=wrong",
      headers: { cookie },
    })
    expect(cb.statusCode).toBe(400)
  })
})

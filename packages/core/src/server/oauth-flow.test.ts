import { describe, it, expect, beforeAll, afterAll, vi } from "vitest"
import type { FastifyInstance } from "fastify"
import { buildServer } from "./server.js"
import type { ApiConfig } from "./config.js"
import { InProcessAdapter, MemoryStore } from "../base.js"
import { defineSettings } from "@acstane/schema"
import { discord } from "@acstane/platform-discord"

const config: ApiConfig = {
  port: 0,
  cookieSecret: "test-secret-at-least-32-chars-long-000",
  allowedOrigins: ["http://localhost:3000"],
  platforms: [discord({ clientId: "cid", clientSecret: "sec", redirectUri: "http://localhost:3001/api/auth/discord/callback" })],
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

  async function startLogin() {
    const start = await app.inject({ method: "GET", url: "/api/auth/discord" })
    const cookie = cookieValue(start.headers["set-cookie"])
    const state = new URL(String(start.headers["location"])).searchParams.get("state")!
    return { cookie, state }
  }

  it("logs a user in via the discord callback", async () => {
    const start = await app.inject({ method: "GET", url: "/api/auth/discord" })
    expect(start.statusCode).toBe(302)
    const cookie = cookieValue(start.headers["set-cookie"])
    const location = String(start.headers["location"])
    expect(location).toContain("code_challenge_method=S256")
    const state = new URL(location).searchParams.get("state")!

    const cb = await app.inject({
      method: "GET",
      url: `/api/auth/discord/callback?code=abc&state=${state}`,
      headers: { cookie },
    })
    expect(cb.statusCode).toBe(302)

    // The session id rotates on login, so use the new cookie afterwards.
    const newCookie = cookieValue(cb.headers["set-cookie"])
    expect(newCookie).not.toBe(cookie)

    const me = await app.inject({ method: "GET", url: "/api/auth/me", headers: { cookie: newCookie } })
    expect(me.statusCode).toBe(200)
    expect(me.json()).toMatchObject({ id: "u1", platform: "discord" })

    const res = await app.inject({ method: "GET", url: "/api/spaces", headers: { cookie: newCookie } })
    const body = res.json() as { platform: string; spaces: { id: string }[] }
    expect(body.platform).toBe("discord")
    // Only the owned and Manage Server guilds, not the plain member one.
    expect(body.spaces.map((g) => g.id).sort()).toEqual(["g1", "g2"])
  })

  it("still logs in through the old /api/auth/callback alias", async () => {
    const { cookie, state } = await startLogin()
    const cb = await app.inject({
      method: "GET",
      url: `/api/auth/callback?code=abc&state=${state}`,
      headers: { cookie },
    })
    expect(cb.statusCode).toBe(302)
    const me = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { cookie: cookieValue(cb.headers["set-cookie"]) },
    })
    expect(me.statusCode).toBe(200)
  })

  it("rejects a callback for a different platform than the login started with", async () => {
    const { cookie, state } = await startLogin()
    const cb = await app.inject({
      method: "GET",
      url: `/api/auth/slack/callback?code=abc&state=${state}`,
      headers: { cookie },
    })
    expect(cb.statusCode).toBe(400)
  })

  it("rejects a callback with a mismatched state", async () => {
    const start = await app.inject({ method: "GET", url: "/api/auth/discord" })
    const cookie = cookieValue(start.headers["set-cookie"])
    const cb = await app.inject({
      method: "GET",
      url: "/api/auth/discord/callback?code=abc&state=wrong",
      headers: { cookie },
    })
    expect(cb.statusCode).toBe(400)
  })

  it("rejects a callback with no state at all", async () => {
    const start = await app.inject({ method: "GET", url: "/api/auth/discord" })
    const cookie = cookieValue(start.headers["set-cookie"])
    // A missing state must not slip past by comparing undefined to undefined.
    const cb = await app.inject({
      method: "GET",
      url: "/api/auth/discord/callback?code=abc",
      headers: { cookie },
    })
    expect(cb.statusCode).toBe(400)
  })

  it("cannot replay the same callback twice", async () => {
    const start = await app.inject({ method: "GET", url: "/api/auth/discord" })
    const cookie = cookieValue(start.headers["set-cookie"])
    const state = new URL(String(start.headers["location"])).searchParams.get("state")!
    const first = await app.inject({
      method: "GET",
      url: `/api/auth/discord/callback?code=abc&state=${state}`,
      headers: { cookie },
    })
    expect(first.statusCode).toBe(302)
    // The old cookie's state and verifier were burned on first use.
    const replay = await app.inject({
      method: "GET",
      url: `/api/auth/discord/callback?code=abc&state=${state}`,
      headers: { cookie },
    })
    expect(replay.statusCode).toBe(400)
  })

  it("refuses to start a login with a platform that is not configured", async () => {
    const res = await app.inject({ method: "GET", url: "/api/auth/slack" })
    expect(res.statusCode).toBe(404)
    expect(res.headers["set-cookie"]).toBeUndefined()
  })

  it("logs out over POST but not GET", async () => {
    const get = await app.inject({ method: "GET", url: "/api/auth/logout" })
    expect(get.statusCode).toBe(404)
    const post = await app.inject({ method: "POST", url: "/api/auth/logout" })
    expect(post.statusCode).toBe(200)
  })
})

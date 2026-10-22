import { describe, it, expect, vi } from "vitest"
import { SessionStore, canManageSpace, SESSION_COOKIE } from "./session.js"

describe("SessionStore", () => {
  it("expires pre auth entries after their short ttl", async () => {
    const store = new SessionStore({ preAuthTtlMs: 20, sweepMs: 0 })
    const id = store.create()
    expect(store.get(id)).toBeDefined()
    await new Promise((r) => setTimeout(r, 30))
    // Lazily evicted on read.
    expect(store.get(id)).toBeUndefined()
  })

  it("keeps logged in sessions past the pre auth ttl", async () => {
    const store = new SessionStore({ preAuthTtlMs: 20, sessionTtlMs: 10_000, sweepMs: 0 })
    const id = store.create()
    store.set(id, { userId: "u1" })
    await new Promise((r) => setTimeout(r, 30))
    expect(store.get(id)?.userId).toBe("u1")
  })

  it("caps the number of stored entries", () => {
    const store = new SessionStore({ maxEntries: 3, sweepMs: 0 })
    for (let i = 0; i < 10; i++) store.create()
    expect(store.size).toBeLessThanOrEqual(3)
  })

  it("matches spaces the user manages on their login platform", () => {
    const session = { platform: "discord", spaces: [{ id: "g1" }] }
    expect(canManageSpace(session, "discord", "g1")).toBe(true)
    expect(canManageSpace(session, "discord", "g2")).toBe(false)
    // The same id on another platform is a different space.
    expect(canManageSpace(session, "slack", "g1")).toBe(false)
    expect(canManageSpace({ spaces: [{ id: "g1" }] }, "discord", "g1")).toBe(false)
    expect(canManageSpace(undefined, "discord", "g1")).toBe(false)
  })

  it("uses a plain cookie name outside production", () => {
    expect(SESSION_COOKIE).toBe("dd_sid")
  })

  it("host locks the cookie name in production", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.resetModules()
    const prod = await import("./session.js")
    expect(prod.SESSION_COOKIE).toBe("__Host-dd_sid")
    vi.unstubAllEnvs()
    vi.resetModules()
  })
})

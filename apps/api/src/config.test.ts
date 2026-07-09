import { describe, it, expect, afterEach } from "vitest"
import { validateConfig } from "./config.js"
import type { ApiConfig } from "./config.js"

const full: ApiConfig = {
  port: 3001,
  cookieSecret: "x".repeat(40),
  allowedOrigins: ["http://localhost:3000"],
  discord: { clientId: "cid", clientSecret: "sec", redirectUri: "http://x/cb" },
  webhookSecret: "hook",
}

describe("validateConfig", () => {
  afterEach(() => {
    delete process.env.NODE_ENV
  })

  it("returns no warnings for a complete config", () => {
    expect(validateConfig(full)).toEqual([])
  })
  it("warns about missing discord credentials", () => {
    const w = validateConfig({ ...full, discord: { clientId: "", clientSecret: "", redirectUri: "" } })
    expect(w.some((m) => m.includes("DISCORD_CLIENT_ID"))).toBe(true)
    expect(w.some((m) => m.includes("DISCORD_CLIENT_SECRET"))).toBe(true)
  })
  it("warns about an unauthenticated webhook in production", () => {
    process.env.NODE_ENV = "production"
    const w = validateConfig({ ...full, webhookSecret: undefined })
    expect(w.some((m) => m.includes("WEBHOOK_SECRET"))).toBe(true)
  })
})

import { describe, it, expect, afterEach } from "vitest"
import { buildServer } from "./server.js"
import type { ApiConfig } from "./config.js"
import { InProcessAdapter, MemoryStore } from "../base.js"
import { defineSettings } from "@acstane/schema"
import { discord } from "@acstane/platform-discord"

const def = defineSettings(() => ({}))
const base = {
  port: 0,
  allowedOrigins: ["http://localhost:3000"],
  platforms: [discord({ clientId: "c", clientSecret: "s", redirectUri: "http://x/cb" })],
}

describe("cookie secret guard", () => {
  afterEach(() => {
    delete process.env.NODE_ENV
  })

  it("refuses to boot in production with a weak secret", async () => {
    process.env.NODE_ENV = "production"
    const config: ApiConfig = { ...base, cookieSecret: "short" }
    await expect(
      buildServer(config, { def, adapter: new InProcessAdapter(def, new MemoryStore()) })
    ).rejects.toThrow(/COOKIE_SECRET/)
  })

  it("boots in production with a strong secret", async () => {
    process.env.NODE_ENV = "production"
    const config: ApiConfig = {
      ...base,
      cookieSecret: "a".repeat(40),
    }
    const app = await buildServer(config, {
      def,
      adapter: new InProcessAdapter(def, new MemoryStore()),
    })
    expect(app).toBeTruthy()
    await app.close()
  })
})

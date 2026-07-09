import { describe, it, expect, beforeAll, afterAll } from "vitest"
import type { FastifyInstance } from "fastify"
import { buildServer } from "./server.js"
import type { ApiConfig } from "./config.js"
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
    name: { en: "General", pl: "Ogolne" },
    options: { prefix: f.text({ label: { en: "Prefix", pl: "Prefiks" } }) },
  }),
}))

describe("schema locale over http", () => {
  let app: FastifyInstance
  beforeAll(async () => {
    app = await buildServer(config, { def, adapter: new InProcessAdapter(def, new MemoryStore()) })
  })
  afterAll(async () => {
    await app.close()
  })
  it("serves a localized schema for the requested locale", async () => {
    const res = await app.inject({ method: "GET", url: "/api/schema?locale=pl" })
    const wire = res.json() as { categories: { name: string; options: { label: string }[] }[] }
    expect(wire.categories[0]?.name).toBe("Ogolne")
    expect(wire.categories[0]?.options[0]?.label).toBe("Prefiks")
  })
  it("defaults to english", async () => {
    const res = await app.inject({ method: "GET", url: "/api/schema" })
    const wire = res.json() as { categories: { name: string }[] }
    expect(wire.categories[0]?.name).toBe("General")
  })
})

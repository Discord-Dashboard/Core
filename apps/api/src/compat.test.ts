import { describe, it, expect, beforeAll, afterAll } from "vitest"
import type { FastifyInstance } from "fastify"
import { buildServer } from "./server.js"
import type { ApiConfig } from "./config.js"
import { fromV2 } from "@discord-dashboard/compat-v2"

const config: ApiConfig = {
  port: 0,
  cookieSecret: "test-secret-at-least-32-chars-long-000",
  allowedOrigins: ["http://localhost:3000"],
  discord: { clientId: "c", clientSecret: "s", redirectUri: "http://x/cb" },
}

// A legacy v2 style settings array with the old callback handlers.
const store: Record<string, unknown> = {}
const v2Settings = [
  {
    categoryId: "general",
    categoryName: "General",
    categoryOptionsList: [
      {
        optionId: "prefix",
        optionName: "Prefix",
        optionType: { type: "input" },
        getActualSet: async () => store["prefix"] ?? null,
        setNew: async ({ newData }: { newData: unknown }) => {
          store["prefix"] = newData
        },
      },
    ],
  },
]

describe("v2 compat through the api", () => {
  let app: FastifyInstance
  beforeAll(async () => {
    const { def, adapter } = fromV2(v2Settings)
    app = await buildServer(config, { def, adapter })
  })
  afterAll(async () => {
    await app.close()
  })

  it("serves the v2 derived schema over the v3 api", async () => {
    const res = await app.inject({ method: "GET", url: "/api/schema" })
    expect(res.statusCode).toBe(200)
    const wire = res.json() as { categories: { id: string; options: { id: string }[] }[] }
    expect(wire.categories[0]?.id).toBe("general")
    expect(wire.categories[0]?.options[0]?.id).toBe("prefix")
  })
})

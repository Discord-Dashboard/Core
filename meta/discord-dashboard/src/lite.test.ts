import { describe, it, expect } from "vitest"
import type { FastifyInstance } from "fastify"
import { createDashboard, defineSettings, f } from "./index.js"

describe("lite mode end to end", () => {
  it("serves a working dashboard over http", async () => {
    const settings = defineSettings((s) => ({
      general: s.category({
        name: "General",
        options: { prefix: f.text({ label: "Prefix", max: 3 }) },
      }),
    }))
    const dash = createDashboard({
      discord: { clientId: "c", clientSecret: "s" },
      settings,
      port: 0,
    })
    const app = (await dash.listen(0)) as FastifyInstance
    const port = (app.server.address() as { port: number }).port

    const health = await fetch(`http://127.0.0.1:${port}/health`)
    expect(((await health.json()) as { ok: boolean }).ok).toBe(true)

    const schemaRes = await fetch(`http://127.0.0.1:${port}/api/schema`)
    const schema = (await schemaRes.json()) as { categories: { id: string }[] }
    expect(schema.categories[0]?.id).toBe("general")

    await app.close()
  })
})

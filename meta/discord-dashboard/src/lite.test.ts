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

  it("wires the page routes in lite mode", async () => {
    const settings = defineSettings(() => ({}))
    const dash = createDashboard({
      discord: { clientId: "c", clientSecret: "s" },
      settings,
      pageEditors: ["u1"],
      port: 0,
    })
    const app = (await dash.listen(0)) as FastifyInstance
    const port = (app.server.address() as { port: number }).port

    // Public listing works and starts empty.
    const list = await fetch(`http://127.0.0.1:${port}/api/pages`)
    expect((await list.json() as { pages: unknown[] }).pages).toEqual([])

    // Editing requires a logged in user.
    const post = await fetch(`http://127.0.0.1:${port}/api/pages/home`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost:3000" },
      body: JSON.stringify({ content: { version: 1, root: { title: "x" }, content: [] } }),
    })
    expect(post.status).toBe(401)

    await app.close()
  })
})

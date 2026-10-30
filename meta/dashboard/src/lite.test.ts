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

  it("has no page builder in lite mode", async () => {
    const dash = createDashboard({
      discord: { clientId: "c", clientSecret: "s" },
      settings: defineSettings(() => ({})),
      port: 0,
    })
    const app = (await dash.listen(0)) as FastifyInstance
    const port = (app.server.address() as { port: number }).port

    // The web app is told the builder is off, so it can hide it.
    const access = await fetch(`http://127.0.0.1:${port}/api/builder/access`)
    expect(await access.json()).toEqual({ enabled: false, canEdit: false, ai: false })

    // And the page routes don't exist.
    const list = await fetch(`http://127.0.0.1:${port}/api/pages`)
    expect(list.status).toBe(404)

    await app.close()
  })

  it("serves only the api when the web app is turned off", async () => {
    const dash = createDashboard({
      discord: { clientId: "c", clientSecret: "s" },
      settings: defineSettings(() => ({})),
      web: false,
    })
    const app = (await dash.listen(0)) as FastifyInstance
    const port = (app.server.address() as { port: number }).port

    const res = await fetch(`http://127.0.0.1:${port}/`)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "not found" })

    await app.close()
  })

  it("reads settings for the bot, with defaults", async () => {
    const values = new Map<string, unknown>()
    const dash = createDashboard({
      discord: { clientId: "c", clientSecret: "s" },
      settings: defineSettings((s) => ({
        general: s.category({
          name: "General",
          options: { prefix: f.text({ default: "!" }), log: f.channel() },
        }),
      })),
      storage: { get: (k) => values.get(k), set: (k, v) => void values.set(k, v) },
    })
    expect(await dash.get("g1", "general.prefix")).toBe("!")
    expect(await dash.get("g1", "general.log")).toBeUndefined()
    values.set("g1:general.prefix", "?")
    expect(await dash.get("g1", "general.prefix")).toBe("?")
  })

  it("runs on a custom adapter", async () => {
    const settings = defineSettings((s) => ({
      general: s.category({ name: "General", options: { prefix: f.text() } }),
    }))
    const dash = createDashboard({
      discord: { clientId: "c", clientSecret: "s" },
      settings,
      web: false,
      adapter: {
        describeSchema: async () => ({ version: "1.0", categories: [] }),
        getChannels: async () => [],
        getRoles: async () => [],
        getMemberPermissions: async () => [],
        getSetting: async () => "from-adapter",
        setSetting: async () => ({ ok: true }),
        invokeAction: async () => null,
      },
    })
    expect(await dash.get("g1", "general.prefix")).toBe("from-adapter")
    const app = (await dash.listen(0)) as FastifyInstance
    const port = (app.server.address() as { port: number }).port
    const res = await fetch(`http://127.0.0.1:${port}/api/schema`)
    expect(((await res.json()) as { categories: unknown[] }).categories).toEqual([])
    await app.close()
  })
})

describe("lite mode billing webhooks", () => {
  it("refuses a webhook it cannot verify instead of granting it", async () => {
    const settings = defineSettings(() => ({}))
    const dash = createDashboard({ discord: { clientId: "c", clientSecret: "s" }, settings, port: 0, web: false })
    const app = (await dash.listen(0)) as FastifyInstance
    const port = (app.server.address() as { port: number }).port
    const forged = await fetch(`http://127.0.0.1:${port}/api/webhooks/stripe`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "customer.subscription.created",
        data: { object: { id: "s", status: "active", metadata: { subjectType: "space", subjectId: "g", feature: "pro" } } },
      }),
    })
    expect(forged.status).toBe(503)
    const discord = await fetch(`http://127.0.0.1:${port}/api/webhooks/discord`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ guild_id: "g", sku_id: "pro" }),
    })
    expect(discord.status).toBe(503)
    await app.close()
  })
})

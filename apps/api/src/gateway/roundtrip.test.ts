import { describe, it, expect } from "vitest"
import { createServer } from "node:http"
import { startGateway } from "./gateway.js"
import { RemoteAdapter } from "./remote-adapter.js"
import { SettingsService, AllowAll } from "@discord-dashboard/core"
import { Adapter, defineSettings, f } from "@discord-dashboard/sdk-js"

async function waitFor(check: () => boolean, ms = 4000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (check()) return
    await new Promise((r) => setTimeout(r, 25))
  }
  throw new Error("timeout")
}

describe("settings round trip over the gateway", () => {
  it("writes and reads a setting through a remote bot", async () => {
    const server = createServer()
    const botId = "rt-bot"
    const secret = "rt-secret"
    const gateway = startGateway(server, async (id) =>
      id === botId ? secret : null
    )
    await new Promise<void>((r) => server.listen(0, r))
    const port = (server.address() as { port: number }).port

    // A bot with an in memory store standing in for its database.
    const store = new Map<string, unknown>()
    const def = defineSettings((s) => ({
      general: s.category({ name: "General", options: { prefix: f.text({ max: 3 }) } }),
    }))
    const bot = new Adapter({ botId, secret, gateway: `ws://127.0.0.1:${port}/gateway` })
      .settings(def)
      .onGet((g, k) => store.get(`${g}:${k}`) ?? null)
      .onSet((g, k, v) => {
        store.set(`${g}:${k}`, v)
      })
    bot.connect()
    await waitFor(() => gateway.sessions.has(botId))

    // The dashboard side uses a RemoteAdapter over the same gateway.
    const remote = new RemoteAdapter(gateway, botId)
    const service = new SettingsService(def, remote, AllowAll)

    const set = await service.set({ guildId: "g1", userId: "u1" }, "general", "prefix", "!")
    expect(set.ok).toBe(true)
    const value = await service.get({ guildId: "g1", userId: "u1" }, "general", "prefix")
    expect(value).toBe("!")

    // A value violating the schema is rejected before it reaches the bot.
    const bad = await service.set({ guildId: "g1", userId: "u1" }, "general", "prefix", "toolong")
    expect(bad.ok).toBe(false)

    bot.disconnect()
    gateway.close()
    server.closeAllConnections?.()
    await new Promise<void>((r) => server.close(() => r()))
  })
})

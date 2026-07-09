import { describe, it, expect } from "vitest"
import { createServer } from "node:http"
import { startGateway } from "./gateway.js"
import { RemoteAdapter } from "./remote-adapter.js"
import {
  SettingsService,
  AllowAll,
  buildDefFromAdapter,
} from "@discord-dashboard/core"
import { Adapter, defineSettings, f } from "@discord-dashboard/sdk-js"

async function waitFor(check: () => boolean, ms = 4000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (check()) return
    await new Promise((r) => setTimeout(r, 25))
  }
  throw new Error("timeout")
}

describe("platform mode remote validation", () => {
  it("rebuilds a live bot schema and validates writes against it", async () => {
    const server = createServer()
    const botId = "pv-bot"
    const secret = "pv-secret"
    const gateway = startGateway(server, async (id) => (id === botId ? secret : null))
    await new Promise<void>((r) => server.listen(0, r))
    const port = (server.address() as { port: number }).port

    const store = new Map<string, unknown>()
    const botDef = defineSettings((s) => ({
      general: s.category({
        name: "General",
        options: { prefix: f.text({ label: "Prefix", max: 3 }) },
      }),
    }))
    const bot = new Adapter({ botId, secret, gateway: `ws://127.0.0.1:${port}/gateway` })
      .settings(botDef)
      .onGet((g, k) => store.get(`${g}:${k}`) ?? null)
      .onSet((g, k, v) => {
        store.set(`${g}:${k}`, v)
      })
    bot.connect()
    await waitFor(() => gateway.sessions.has(botId))

    // The dashboard has no Zod code from the bot, only its wire descriptor.
    const remote = new RemoteAdapter(gateway, botId)
    const def = await buildDefFromAdapter(remote)
    const service = new SettingsService(def, remote, AllowAll)

    const ok = await service.set({ guildId: "g", userId: "u" }, "general", "prefix", "!")
    expect(ok.ok).toBe(true)
    const bad = await service.set({ guildId: "g", userId: "u" }, "general", "prefix", "toolong")
    expect(bad.ok).toBe(false)

    expect(store.get("g:general.prefix")).toBe("!")

    bot.disconnect()
    gateway.close()
    server.closeAllConnections?.()
    await new Promise<void>((r) => server.close(() => r()))
  })
})

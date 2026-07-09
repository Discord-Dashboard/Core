import { describe, it, expect } from "vitest"
import { createServer } from "node:http"
import { startGateway, type GatewayEvent } from "./gateway.js"
import { Adapter, defineSettings } from "@discord-dashboard/sdk-js"

async function waitFor(check: () => boolean, ms = 4000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (check()) return
    await new Promise((r) => setTimeout(r, 25))
  }
  throw new Error("timeout")
}

describe("gateway notifications", () => {
  it("delivers a setting.changed event pushed by the bot", async () => {
    const server = createServer()
    const botId = "ev-bot"
    const secret = "ev-secret"
    const gateway = startGateway(server, async (id) => (id === botId ? secret : null))
    await new Promise<void>((r) => server.listen(0, r))
    const port = (server.address() as { port: number }).port

    const events: GatewayEvent[] = []
    gateway.onEvent((e) => events.push(e))

    const bot = new Adapter({ botId, secret, gateway: `ws://127.0.0.1:${port}/gateway` })
      .settings(defineSettings(() => ({})))
    bot.connect()
    await waitFor(() => gateway.sessions.has(botId))

    bot.push("setting.changed", { guildId: "g", key: "general.prefix", value: "!" })
    await waitFor(() => events.length > 0)

    expect(events[0]?.method).toBe("setting.changed")
    expect(events[0]?.botId).toBe(botId)
    expect((events[0]?.params as { key: string }).key).toBe("general.prefix")

    bot.disconnect()
    gateway.close()
    server.closeAllConnections?.()
    await new Promise<void>((r) => server.close(() => r()))
  })
})

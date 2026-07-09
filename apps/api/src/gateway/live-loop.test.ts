import { describe, it, expect } from "vitest"
import { createServer } from "node:http"
import { startGateway } from "./gateway.js"
import { RemoteAdapter } from "./remote-adapter.js"
import { EventHub, wireEvents, type HubEvent } from "../events-hub.js"
import { Adapter, defineSettings } from "@discord-dashboard/sdk-js"

async function waitFor(check: () => boolean, ms = 4000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (check()) return
    await new Promise((r) => setTimeout(r, 25))
  }
  throw new Error("timeout")
}

describe("live update loop", () => {
  it("propagates a dashboard write to a subscriber via the bot", async () => {
    const server = createServer()
    const botId = "live-bot"
    const secret = "live-secret"
    const gateway = startGateway(server, async (id) => (id === botId ? secret : null))
    const hub = new EventHub()
    wireEvents(gateway, hub)
    await new Promise<void>((r) => server.listen(0, r))
    const port = (server.address() as { port: number }).port

    // The bot persists the value and then announces the change.
    const store = new Map<string, unknown>()
    const bot = new Adapter({ botId, secret, gateway: `ws://127.0.0.1:${port}/gateway` })
      .settings(defineSettings(() => ({})))
      .onGet((g, k) => store.get(`${g}:${k}`) ?? null)
    bot.onSet((g, k, v) => {
      store.set(`${g}:${k}`, v)
      bot.push("setting.changed", { guildId: g, key: k, value: v })
    })
    bot.connect()
    await waitFor(() => gateway.sessions.has(botId))

    const received: HubEvent[] = []
    hub.subscribe((e) => received.push(e), "g1")

    const remote = new RemoteAdapter(gateway, botId)
    await remote.setSetting("g1", "general.prefix", "!")

    await waitFor(() => received.length > 0)
    expect(received[0]?.method).toBe("setting.changed")
    expect((received[0]?.params as { value: string }).value).toBe("!")
    expect(store.get("g1:general.prefix")).toBe("!")

    bot.disconnect()
    gateway.close()
    server.closeAllConnections?.()
    await new Promise<void>((r) => server.close(() => r()))
  })
})

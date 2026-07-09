import { describe, it, expect } from "vitest"
import { createServer } from "node:http"
import { startGateway } from "./gateway.js"
import { Adapter, defineSettings } from "@discord-dashboard/sdk-js"

async function waitFor(check: () => boolean, ms = 4000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (check()) return
    await new Promise((r) => setTimeout(r, 25))
  }
  throw new Error("timeout")
}

describe("gateway onConnect", () => {
  it("fires when a bot completes the handshake", async () => {
    const server = createServer()
    const botId = "conn-bot"
    const secret = "conn-secret"
    const gateway = startGateway(server, async (id) => (id === botId ? secret : null))
    const connected: string[] = []
    gateway.onConnect((id) => connected.push(id))
    await new Promise<void>((r) => server.listen(0, r))
    const port = (server.address() as { port: number }).port

    const bot = new Adapter({ botId, secret, gateway: `ws://127.0.0.1:${port}/gateway` })
      .settings(defineSettings(() => ({})))
    bot.connect()
    await waitFor(() => connected.length > 0)
    expect(connected).toEqual([botId])

    bot.disconnect()
    gateway.close()
    server.closeAllConnections?.()
    await new Promise<void>((r) => server.close(() => r()))
  })
})

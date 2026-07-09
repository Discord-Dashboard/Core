import { describe, it, expect } from "vitest"
import { createServer } from "node:http"
import { startGateway } from "./gateway.js"
import { Adapter, defineSettings } from "@discord-dashboard/sdk-js"

async function waitFor(check: () => boolean, ms = 5000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (check()) return
    await new Promise((r) => setTimeout(r, 25))
  }
  throw new Error("timeout")
}

describe("sdk auto reconnect", () => {
  it("re handshakes after the connection drops", async () => {
    const server = createServer()
    const botId = "recon-bot"
    const secret = "recon-secret"
    const gateway = startGateway(server, async (id) => (id === botId ? secret : null))
    let connects = 0
    gateway.onConnect(() => connects++)
    await new Promise<void>((r) => server.listen(0, r))
    const port = (server.address() as { port: number }).port

    const bot = new Adapter({
      botId,
      secret,
      gateway: `ws://127.0.0.1:${port}/gateway`,
      reconnectMs: 50,
    }).settings(defineSettings(() => ({})))
    bot.connect()
    await waitFor(() => connects === 1)

    // Drop the bot's connection from the server side.
    gateway.sessions.get(botId)?.socket.terminate()

    // The bot should reconnect and handshake again.
    await waitFor(() => connects >= 2)
    expect(connects).toBeGreaterThanOrEqual(2)

    bot.disconnect()
    gateway.close()
    server.closeAllConnections?.()
    await new Promise<void>((r) => server.close(() => r()))
  })
})

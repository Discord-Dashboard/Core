import { describe, it, expect } from "vitest"
import { createServer } from "node:http"
import { startGateway } from "./gateway.js"
import { RemoteAdapter } from "./remote-adapter.js"
import { Adapter, defineSettings } from "@discord-dashboard/sdk-js"

async function waitFor(check: () => boolean, ms = 4000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (check()) return
    await new Promise((r) => setTimeout(r, 25))
  }
  throw new Error("timeout")
}

describe("action invoke over the gateway", () => {
  it("invokes a bot action and returns its result", async () => {
    const server = createServer()
    const botId = "act-bot"
    const secret = "act-secret"
    const gateway = startGateway(server, async (id) => (id === botId ? secret : null))
    await new Promise<void>((r) => server.listen(0, r))
    const port = (server.address() as { port: number }).port

    const bot = new Adapter({ botId, secret, gateway: `ws://127.0.0.1:${port}/gateway` })
      .settings(defineSettings(() => ({})))
      .onAction((guildId, name, payload) => ({ guild: guildId, ran: name, echo: payload }))
    bot.connect()
    await waitFor(() => gateway.sessions.has(botId))

    const remote = new RemoteAdapter(gateway, botId)
    const result = (await remote.invokeAction("g1", "sendTest", { channel: "c1" })) as {
      guild: string
      ran: string
      echo: { channel: string }
    }
    // The guild id comes from the authorized call, not from the payload.
    expect(result.guild).toBe("g1")
    expect(result.ran).toBe("sendTest")
    expect(result.echo.channel).toBe("c1")

    bot.disconnect()
    gateway.close()
    server.closeAllConnections?.()
    await new Promise<void>((r) => server.close(() => r()))
  })
})

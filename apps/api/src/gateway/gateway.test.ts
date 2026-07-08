import { describe, it, expect } from "vitest"
import { createServer } from "node:http"
import { startGateway } from "./gateway.js"
import { Adapter, defineSettings, f } from "@discord-dashboard/sdk-js"

async function waitFor(check: () => boolean, ms = 4000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (check()) return
    await new Promise((r) => setTimeout(r, 25))
  }
  throw new Error("timeout waiting for condition")
}

async function shutdown(server: import("node:http").Server) {
  server.closeAllConnections?.()
  await new Promise<void>((resolve) => server.close(() => resolve()))
}

describe("gateway protocol (integration)", () => {
  it("completes the handshake and answers settings.describe", async () => {
    const server = createServer()
    const botId = "bot-1"
    const secret = "bot-secret"
    const gateway = startGateway(server, async (id) =>
      id === botId ? secret : null
    )
    await new Promise<void>((resolve) => server.listen(0, resolve))
    const port = (server.address() as { port: number }).port

    const def = defineSettings((s) => ({
      general: s.category({ name: "General", options: { prefix: f.text() } }),
    }))
    const bot = new Adapter({ botId, secret, gateway: `ws://127.0.0.1:${port}/gateway` })
      .settings(def)
      .onGet(() => null)
      .onSet(() => {})
    bot.connect()

    await waitFor(() => gateway.sessions.has(botId))
    const schema = (await gateway.call(botId, "settings.describe")) as {
      categories: { id: string }[]
    }
    expect(schema.categories[0]?.id).toBe("general")

    bot.disconnect()
    gateway.close()
    await shutdown(server)
  })

  it("refuses a bot with a wrong secret", async () => {
    const server = createServer()
    const gateway = startGateway(server, async () => "right-secret")
    await new Promise<void>((resolve) => server.listen(0, resolve))
    const port = (server.address() as { port: number }).port

    const bot = new Adapter({
      botId: "bot-2",
      secret: "wrong-secret",
      gateway: `ws://127.0.0.1:${port}/gateway`,
    })
      .settings(defineSettings(() => ({})))
    bot.connect()

    await new Promise((r) => setTimeout(r, 500))
    expect(gateway.sessions.has("bot-2")).toBe(false)

    bot.disconnect()
    gateway.close()
    await shutdown(server)
  })
})

import { describe, it, expect } from "vitest"
import { createServer } from "node:http"
import { WebSocket } from "ws"
import crypto from "node:crypto"
import { startGateway } from "./gateway.js"

async function waitFor(check: () => boolean, ms = 4000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (check()) return
    await new Promise((r) => setTimeout(r, 25))
  }
  throw new Error("timeout waiting")
}

describe("gateway auth deadline", () => {
  it("drops a connection that never sends hello", async () => {
    const server = createServer()
    const gateway = startGateway(server, async () => "secret", { authTimeoutMs: 80 })
    await new Promise<void>((r) => server.listen(0, r))
    const port = (server.address() as { port: number }).port

    // Connect but never authenticate.
    const ws = new WebSocket(`ws://127.0.0.1:${port}/gateway`)
    let closed = false
    ws.on("close", () => {
      closed = true
    })
    await new Promise<void>((r) => ws.on("open", () => r()))
    await waitFor(() => closed)
    expect(closed).toBe(true)

    gateway.close()
    server.closeAllConnections?.()
    await new Promise<void>((r) => server.close(() => r()))
  })

  it("rejects in flight calls when the bot socket closes", async () => {
    const server = createServer()
    const botId = "drop-bot"
    const secret = "drop-secret"
    const gateway = startGateway(server, async (id) => (id === botId ? secret : null))
    await new Promise<void>((r) => server.listen(0, r))
    const port = (server.address() as { port: number }).port

    const ws = new WebSocket(`ws://127.0.0.1:${port}/gateway`)
    ws.on("message", (raw) => {
      const f = JSON.parse(raw.toString())
      if (f.type === "challenge") {
        const sig = crypto.createHmac("sha256", secret).update(String(f.nonce)).digest("hex")
        ws.send(
          JSON.stringify({
            jsonrpc: "2.0",
            id: "hello",
            method: "hello",
            params: { protocolVersion: "1.0.0", botId, nonceSig: sig, capabilities: [] },
          })
        )
      }
      // never answers rpc calls
    })
    await waitFor(() => gateway.sessions.has(botId))

    const pending = gateway.call(botId, "settings.describe", undefined, 5000)
    // Close the socket while the call is outstanding.
    ws.close()
    await expect(pending).rejects.toThrow(/closed/)

    gateway.close()
    server.closeAllConnections?.()
    await new Promise<void>((r) => server.close(() => r()))
  })

  it("rejects a call when the bot returns a json-rpc error", async () => {
    const server = createServer()
    const botId = "err-bot"
    const secret = "err-secret"
    const gateway = startGateway(server, async (id) => (id === botId ? secret : null))
    await new Promise<void>((r) => server.listen(0, r))
    const port = (server.address() as { port: number }).port

    const ws = new WebSocket(`ws://127.0.0.1:${port}/gateway`)
    ws.on("message", (raw) => {
      const f = JSON.parse(raw.toString())
      if (f.type === "challenge") {
        const sig = crypto.createHmac("sha256", secret).update(String(f.nonce)).digest("hex")
        ws.send(
          JSON.stringify({
            jsonrpc: "2.0",
            id: "hello",
            method: "hello",
            params: { protocolVersion: "1.0.0", botId, nonceSig: sig, capabilities: [] },
          })
        )
        return
      }
      if (typeof f.id !== "undefined" && f.method) {
        ws.send(
          JSON.stringify({ jsonrpc: "2.0", id: f.id, error: { code: 4404, message: "no guild" } })
        )
      }
    })
    await waitFor(() => gateway.sessions.has(botId))

    await expect(gateway.call(botId, "setting.get", { guildId: "g", key: "k" }, 5000)).rejects.toThrow(
      /no guild/
    )

    ws.close()
    gateway.close()
    server.closeAllConnections?.()
    await new Promise<void>((r) => server.close(() => r()))
  })
})

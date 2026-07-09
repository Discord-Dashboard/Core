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

describe("gateway rpc timeout", () => {
  it("rejects when the bot never answers", async () => {
    const server = createServer()
    const botId = "silent-bot"
    const secret = "silent-secret"
    const gateway = startGateway(server, async (id) => (id === botId ? secret : null))
    await new Promise<void>((r) => server.listen(0, r))
    const port = (server.address() as { port: number }).port

    // A raw client that handshakes but ignores every rpc call.
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
      // ignores all other frames on purpose
    })

    await waitFor(() => gateway.sessions.has(botId))
    await expect(gateway.call(botId, "settings.describe", undefined, 250)).rejects.toThrow(
      /timeout/
    )

    ws.close()
    gateway.close()
    server.closeAllConnections?.()
    await new Promise<void>((r) => server.close(() => r()))
  })
})

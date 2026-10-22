import { describe, it, expect } from "vitest"
import { createServer } from "node:http"
import { WebSocket } from "ws"
import crypto from "node:crypto"
import { startGateway } from "./gateway.js"

function connect(port: number, botId: string, secret: string): WebSocket {
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
  })
  return ws
}

async function waitFor(check: () => boolean, ms = 4000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (check()) return
    await new Promise((r) => setTimeout(r, 25))
  }
  throw new Error("timeout")
}

describe("session replacement", () => {
  it("keeps the newest session when an old duplicate closes", async () => {
    const server = createServer()
    const botId = "dup-bot"
    const secret = "dup-secret"
    let connects = 0
    const gateway = startGateway(server, async (id) => (id === botId ? secret : null))
    gateway.onConnect(() => connects++)
    await new Promise<void>((r) => server.listen(0, r))
    const port = (server.address() as { port: number }).port

    const a = connect(port, botId, secret)
    await waitFor(() => connects === 1)
    const b = connect(port, botId, secret)
    await waitFor(() => connects === 2)

    // Close the first connection. The session must remain (it belongs to b now).
    a.close()
    await new Promise((r) => setTimeout(r, 300))
    expect(gateway.sessions.has(botId)).toBe(true)

    b.close()
    gateway.close()
    server.closeAllConnections?.()
    await new Promise<void>((r) => server.close(() => r()))
  })
})

import { describe, it, expect } from "vitest"
import { createServer } from "node:http"
import { WebSocket } from "ws"
import crypto from "node:crypto"
import { startGateway } from "./gateway.js"

async function tryHandshake(version: string): Promise<boolean> {
  const server = createServer()
  const botId = "ver-bot"
  const secret = "ver-secret"
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
          params: { protocolVersion: version, botId, nonceSig: sig, capabilities: [] },
        })
      )
    }
  })
  await new Promise((r) => setTimeout(r, 400))
  const ok = gateway.sessions.has(botId)
  ws.close()
  gateway.close()
  server.closeAllConnections?.()
  await new Promise<void>((r) => server.close(() => r()))
  return ok
}

describe("protocol version negotiation", () => {
  it("accepts a matching major version", async () => {
    expect(await tryHandshake("1.0.0")).toBe(true)
  })
  it("rejects an incompatible major version", async () => {
    expect(await tryHandshake("99.0.0")).toBe(false)
  })
})

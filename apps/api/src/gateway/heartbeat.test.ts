import { describe, it, expect } from "vitest"
import { createServer } from "node:http"
import { WebSocket } from "ws"
import { startGateway } from "./gateway.js"

describe("gateway heartbeat", () => {
  it("pings connected clients", async () => {
    const server = createServer()
    const gateway = startGateway(server, async () => null, { heartbeatMs: 80 })
    await new Promise<void>((r) => server.listen(0, r))
    const port = (server.address() as { port: number }).port

    const ws = new WebSocket(`ws://127.0.0.1:${port}/gateway`)
    let pinged = false
    ws.on("ping", () => {
      pinged = true
    })

    await new Promise((r) => setTimeout(r, 300))
    expect(pinged).toBe(true)

    ws.close()
    gateway.close()
    server.closeAllConnections?.()
    await new Promise<void>((r) => server.close(() => r()))
  })
})

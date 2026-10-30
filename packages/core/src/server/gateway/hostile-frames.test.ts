import { describe, it, expect } from "vitest"
import { createServer } from "node:http"
import crypto from "node:crypto"
import net from "node:net"
import { WebSocket } from "ws"
import { startGateway } from "./gateway.js"
import { RemoteAdapter } from "./remote-adapter.js"
import { Adapter, defineSettings } from "@acstane/sdk-js"

async function waitFor(check: () => boolean, ms = 4000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (check()) return
    await new Promise((r) => setTimeout(r, 25))
  }
  throw new Error("timeout")
}

async function listen(maxPayload?: number) {
  const server = createServer()
  const botId = "hostile-bot"
  const secret = "hostile-secret"
  const gateway = startGateway(server, async (id) => (id === botId ? secret : null), {
    ...(maxPayload ? { maxPayload } : {}),
  })
  await new Promise<void>((r) => server.listen(0, r))
  const port = (server.address() as { port: number }).port
  const stop = async () => {
    gateway.close()
    server.closeAllConnections?.()
    await new Promise<void>((r) => server.close(() => r()))
  }
  return { gateway, port, botId, secret, stop }
}

// Opens a socket, waits for the challenge, sends one raw frame and resolves
// with the close code (or null if the socket stayed open).
function sendRaw(port: number, frame: string, waitMs = 300): Promise<number | null> {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/gateway`)
    let code: number | null = null
    ws.on("close", (c) => {
      code = c
    })
    ws.on("error", () => {})
    ws.once("message", () => {
      ws.send(frame)
      setTimeout(() => {
        ws.terminate()
        resolve(code)
      }, waitMs)
    })
  })
}

describe("gateway with hostile frames", () => {
  it("survives malformed frames sent before authenticating", async () => {
    const { gateway, port, botId, secret, stop } = await listen()
    // Each of these used to throw inside the async handler; an unhandled
    // rejection exits Node, so one of them took the whole server down.
    for (const frame of [
      "null",
      "[]",
      "42",
      '"hello"',
      '{"method":"hello"}',
      '{"method":"hello","params":null}',
      '{"method":"hello","params":{"botId":5,"nonceSig":{}}}',
    ]) {
      await sendRaw(port, frame)
    }

    // The server is still up, and a real bot still connects.
    const bot = new Adapter({ botId, secret, gateway: `ws://127.0.0.1:${port}/gateway` })
      .settings(defineSettings(() => ({})))
      .connect()
    await waitFor(() => gateway.sessions.has(botId))
    bot.disconnect()
    await stop()
  })

  it("survives a broken websocket frame", async () => {
    const { gateway, port, botId, secret, stop } = await listen()
    // A raw upgrade, then a masked text frame whose payload is invalid UTF-8.
    await new Promise<void>((resolve) => {
      const s = net.connect(port, "127.0.0.1", () => {
        s.write(
          "GET /gateway HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n" +
            "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n\r\n"
        )
        setTimeout(() => {
          s.write(Buffer.from([0x81, 0x81, 1, 2, 3, 4, 0xff ^ 1]))
          setTimeout(() => {
            s.destroy()
            resolve()
          }, 200)
        }, 100)
      })
      s.on("error", () => {})
    })
    const bot = new Adapter({ botId, secret, gateway: `ws://127.0.0.1:${port}/gateway` })
      .settings(defineSettings(() => ({})))
      .connect()
    await waitFor(() => gateway.sessions.has(botId))
    bot.disconnect()
    await stop()
  })

  it("drops a frame larger than maxPayload", async () => {
    const { port, stop } = await listen(1024)
    const code = await sendRaw(port, JSON.stringify({ method: "hello", pad: "x".repeat(4096) }))
    // 1009: message too big.
    expect(code).toBe(1009)
    await stop()
  })

  it("ignores null frames from an authenticated bot", async () => {
    const { gateway, port, botId, secret, stop } = await listen()
    const ws = new WebSocket(`ws://127.0.0.1:${port}/gateway`)
    ws.on("message", (raw) => {
      const f = JSON.parse(raw.toString())
      if (f.type === "challenge") {
        const nonceSig = crypto.createHmac("sha256", secret).update(String(f.nonce)).digest("hex")
        ws.send(
          JSON.stringify({
            jsonrpc: "2.0",
            id: "hello",
            method: "hello",
            params: { protocolVersion: "2.0.0", botId, nonceSig, capabilities: [] },
          })
        )
      }
    })
    await waitFor(() => gateway.sessions.has(botId))
    ws.send("null")
    ws.send("[1,2]")
    await new Promise((r) => setTimeout(r, 100))
    expect(gateway.sessions.has(botId)).toBe(true)
    ws.close()
    await stop()
  })
})

describe("bot sdk with a failing handler", () => {
  it("answers with an rpc error and keeps the bot connected", async () => {
    const { gateway, port, botId, secret, stop } = await listen()
    const bot = new Adapter({ botId, secret, gateway: `ws://127.0.0.1:${port}/gateway` })
      .settings(defineSettings(() => ({})))
      // A handler that trusts its payload, as real ones do.
      .onAction((_space, _name, payload) => (payload as { channel: string }).channel.toUpperCase())
    bot.connect()
    await waitFor(() => gateway.sessions.has(botId))

    const remote = new RemoteAdapter(gateway, botId)
    const started = Date.now()
    await expect(remote.invokeAction("g1", "announce", {})).rejects.toThrow(/toUpperCase/)
    // Rejected by the bot's error reply, not by the 10 second rpc timeout.
    expect(Date.now() - started).toBeLessThan(2000)

    // Same connection, next call works.
    expect(await remote.invokeAction("g1", "announce", { channel: "general" })).toBe("GENERAL")
    expect(gateway.sessions.has(botId)).toBe(true)

    bot.disconnect()
    await stop()
  })
})

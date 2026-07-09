import { WebSocketServer, type WebSocket } from "ws"
import crypto from "node:crypto"
import type { Server } from "node:http"
import {
  PROTOCOL_VERSION,
  ProtocolErrorCode,
  type HelloParams,
} from "@discord-dashboard/protocol"

interface Pending {
  resolve: (value: unknown) => void
  reject: (err: Error) => void
}

export interface BotSession {
  botId: string
  socket: WebSocket
  pending: Map<string, Pending>
}

// Looks up the shared secret for a bot. Wired to the db in M2. Returning null
// means the bot is unknown and the connection is refused.
export type SecretLookup = (botId: string) => Promise<string | null>

export interface GatewayEvent {
  botId: string
  method: string
  params: unknown
}

export type EventListener = (event: GatewayEvent) => void

export interface Gateway {
  sessions: Map<string, BotSession>
  call<R = unknown>(botId: string, method: string, params?: unknown): Promise<R>
  onEvent(listener: EventListener): void
  close(): void
}

export function startGateway(server: Server, lookup?: SecretLookup): Gateway {
  const wss = new WebSocketServer({ server, path: "/gateway" })
  const sessions = new Map<string, BotSession>()
  const listeners: EventListener[] = []

  wss.on("connection", (socket) => {
    const nonce = crypto.randomBytes(16).toString("hex")
    let session: BotSession | null = null

    socket.send(
      JSON.stringify({ type: "challenge", nonce, protocolVersion: PROTOCOL_VERSION })
    )

    socket.on("message", async (raw) => {
      let frame: Record<string, unknown>
      try {
        frame = JSON.parse(raw.toString())
      } catch {
        return
      }

      if (!session) {
        if (frame.method !== "hello") return
        const params = frame.params as HelloParams
        const secret = (await lookup?.(params.botId)) ?? null
        if (!secret) return close(socket, ProtocolErrorCode.Unauthorized)

        const expected = crypto
          .createHmac("sha256", secret)
          .update(nonce)
          .digest("hex")
        if (expected !== params.nonceSig) {
          return close(socket, ProtocolErrorCode.Unauthorized)
        }

        session = { botId: params.botId, socket, pending: new Map() }
        sessions.set(params.botId, session)
        socket.send(
          JSON.stringify({
            jsonrpc: "2.0",
            id: frame.id,
            result: { sessionId: crypto.randomUUID(), heartbeatMs: 30000 },
          })
        )
        return
      }

      if (typeof frame.id !== "undefined" && "result" in frame) {
        const pending = session.pending.get(String(frame.id))
        pending?.resolve(frame.result)
        session.pending.delete(String(frame.id))
        return
      }

      // A notification the bot pushes, such as setting.changed or stats.push.
      if (typeof frame.method === "string" && typeof frame.id === "undefined") {
        const event = { botId: session.botId, method: frame.method, params: frame.params }
        for (const listener of listeners) listener(event)
      }
    })

    socket.on("close", () => {
      if (session) sessions.delete(session.botId)
    })
  })

  function call<R>(botId: string, method: string, params?: unknown): Promise<R> {
    const session = sessions.get(botId)
    if (!session) return Promise.reject(new Error("bot not connected"))
    const id = crypto.randomUUID()
    return new Promise<R>((resolve, reject) => {
      session.pending.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
      })
      session.socket.send(JSON.stringify({ jsonrpc: "2.0", id, method, params }))
    })
  }

  function closeGateway() {
    for (const client of wss.clients) client.terminate()
    wss.close()
  }

  function onEvent(listener: EventListener) {
    listeners.push(listener)
  }

  return {
    sessions,
    call: call as Gateway["call"],
    onEvent,
    close: closeGateway,
  }
}

function close(socket: WebSocket, code: number) {
  socket.close(4000 + (code % 1000))
}

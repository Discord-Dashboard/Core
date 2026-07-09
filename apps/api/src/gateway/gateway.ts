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
  call<R = unknown>(
    botId: string,
    method: string,
    params?: unknown,
    timeoutMs?: number
  ): Promise<R>
  onEvent(listener: EventListener): void
  onConnect(listener: (botId: string) => void): void
  close(): void
}

export interface GatewayOptions {
  heartbeatMs?: number
}

export function startGateway(
  server: Server,
  lookup?: SecretLookup,
  options: GatewayOptions = {}
): Gateway {
  const heartbeatMs = options.heartbeatMs ?? 30000
  const wss = new WebSocketServer({ server, path: "/gateway" })
  const sessions = new Map<string, BotSession>()
  const listeners: EventListener[] = []
  const connectListeners: ((botId: string) => void)[] = []

  wss.on("connection", (socket) => {
    const nonce = crypto.randomBytes(16).toString("hex")
    let session: BotSession | null = null

    // Detect dead (half open) connections: ping periodically and drop a socket
    // that has not ponged since the last ping.
    let isAlive = true
    socket.on("pong", () => {
      isAlive = true
    })
    const heartbeat = setInterval(() => {
      if (!isAlive) return socket.terminate()
      isAlive = false
      socket.ping()
    }, heartbeatMs)
    socket.on("close", () => clearInterval(heartbeat))

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

        // Reject a bot speaking an incompatible protocol major version.
        const major = (v: string) => v.split(".")[0]
        if (major(params.protocolVersion ?? "") !== major(PROTOCOL_VERSION)) {
          return close(socket, ProtocolErrorCode.VersionMismatch)
        }

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
            result: { sessionId: crypto.randomUUID(), heartbeatMs },
          })
        )
        for (const listener of connectListeners) listener(params.botId)
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
      // Only clear the session if it is still the current one. A reconnect with
      // the same bot id must not have its fresh session removed by the old
      // socket closing.
      if (session && sessions.get(session.botId) === session) {
        sessions.delete(session.botId)
      }
    })
  })

  function call<R>(
    botId: string,
    method: string,
    params?: unknown,
    timeoutMs = 10000
  ): Promise<R> {
    const session = sessions.get(botId)
    if (!session) return Promise.reject(new Error("bot not connected"))
    const id = crypto.randomUUID()
    return new Promise<R>((resolve, reject) => {
      // Never let a pending call hang forever if the bot does not answer.
      const timer = setTimeout(() => {
        session.pending.delete(id)
        reject(new Error("rpc timeout"))
      }, timeoutMs)
      session.pending.set(id, {
        resolve: (value: unknown) => {
          clearTimeout(timer)
          ;(resolve as (v: unknown) => void)(value)
        },
        reject: (err) => {
          clearTimeout(timer)
          reject(err)
        },
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

  function onConnect(listener: (botId: string) => void) {
    connectListeners.push(listener)
  }

  return {
    sessions,
    call: call as Gateway["call"],
    onEvent,
    onConnect,
    close: closeGateway,
  }
}

function close(socket: WebSocket, code: number) {
  socket.close(4000 + (code % 1000))
}

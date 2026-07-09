import { WebSocket } from "ws"
import crypto from "node:crypto"
import { PROTOCOL_VERSION } from "@discord-dashboard/protocol"
import { toWire, type SettingsDef } from "@discord-dashboard/schema"

type Getter = (guildId: string, key: string) => Promise<unknown> | unknown
type Setter = (
  guildId: string,
  key: string,
  value: unknown
) => Promise<void> | void
type ActionHandler = (name: string, payload?: unknown) => Promise<unknown> | unknown

export interface AdapterOptions {
  botId: string
  secret: string
  gateway: string
}

// The bot connects out to the gateway, proves identity by signing the server
// nonce, then answers protocol calls. No inbound port is needed.
export class Adapter {
  private ws?: WebSocket
  private schema?: SettingsDef
  private getter?: Getter
  private setter?: Setter
  private action?: ActionHandler

  constructor(private readonly opts: AdapterOptions) {}

  settings(def: SettingsDef) {
    this.schema = def
    return this
  }
  onGet(fn: Getter) {
    this.getter = fn
    return this
  }
  onSet(fn: Setter) {
    this.setter = fn
    return this
  }
  onAction(fn: ActionHandler) {
    this.action = fn
    return this
  }

  connect() {
    const ws = new WebSocket(this.opts.gateway)
    this.ws = ws
    ws.on("message", (raw) => this.handle(raw.toString()))
    return this
  }

  disconnect() {
    this.ws?.close()
  }

  // Push a notification to the dashboard, such as setting.changed.
  push(method: string, params?: unknown) {
    this.send({ jsonrpc: "2.0", method, params })
  }

  private send(obj: unknown) {
    this.ws?.send(JSON.stringify(obj))
  }

  private async handle(raw: string) {
    let frame: Record<string, unknown>
    try {
      frame = JSON.parse(raw)
    } catch {
      return
    }

    if (frame.type === "challenge") {
      const nonce = String(frame.nonce)
      const nonceSig = crypto
        .createHmac("sha256", this.opts.secret)
        .update(nonce)
        .digest("hex")
      this.send({
        jsonrpc: "2.0",
        id: "hello",
        method: "hello",
        params: {
          protocolVersion: PROTOCOL_VERSION,
          botId: this.opts.botId,
          nonceSig,
          capabilities: [],
        },
      })
      return
    }

    if (typeof frame.method === "string" && "id" in frame) {
      const result = await this.dispatch(
        frame.method,
        frame.params as Record<string, unknown> | undefined
      )
      this.send({ jsonrpc: "2.0", id: frame.id, result })
    }
  }

  private async dispatch(method: string, params?: Record<string, unknown>) {
    switch (method) {
      case "settings.describe":
        return this.schema
          ? toWire(this.schema, params?.locale as string | undefined)
          : { version: "1.0", categories: [] }
      case "setting.get": {
        const value = await this.getter?.(
          String(params?.guildId),
          String(params?.key)
        )
        return { value }
      }
      case "setting.set": {
        await this.setter?.(
          String(params?.guildId),
          String(params?.key),
          params?.value
        )
        return { ok: true }
      }
      case "action.invoke":
        return (await this.action?.(String(params?.name), params?.payload)) ?? null
      default:
        return {}
    }
  }
}

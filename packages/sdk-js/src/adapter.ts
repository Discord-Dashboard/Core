import { WebSocket } from "ws"
import crypto from "node:crypto"
import {
  PROTOCOL_VERSION,
  JSONRPC_VERSION,
  WIRE_VERSION,
  HandshakeType,
  ProtocolErrorCode,
  RpcMethod,
  type OptionListItem,
} from "@acstane/protocol"
import { toWire, type SettingsDef } from "@acstane/schema"

// Whether a parsed frame is a JSON object rather than null, an array or a
// primitive.
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

interface Actor {
  userId?: string
}
// Every handler gets the space id first. The platform id, such as "discord",
// comes last, for a bot that serves more than one platform.
type Getter = (
  spaceId: string,
  key: string,
  actor?: Actor,
  platform?: string
) => Promise<unknown> | unknown
type Setter = (
  spaceId: string,
  key: string,
  value: unknown,
  actor?: Actor,
  platform?: string
) => Promise<void> | void
type ActionHandler = (
  spaceId: string,
  name: string,
  payload?: unknown,
  platform?: string
) => Promise<unknown> | unknown
// Lists what a picker offers, such as a space's channels or roles.
type ResourcesHandler = (
  spaceId: string,
  kind: string,
  filter?: Record<string, unknown>,
  platform?: string
) => Promise<OptionListItem[]> | OptionListItem[]
// A member's permissions in a space, such as ["MANAGE_GUILD"].
type PermissionsHandler = (
  spaceId: string,
  userId: string,
  platform?: string
) => Promise<string[]> | string[]

export interface AdapterOptions {
  botId: string
  secret: string
  gateway: string
  // Delay before reconnecting after a dropped connection. 0 disables reconnect.
  reconnectMs?: number
}

// The bot connects out to the gateway, proves identity by signing the server
// nonce, then answers protocol calls. No inbound port is needed. It reconnects
// automatically so it survives a dashboard restart.
export class Adapter {
  private ws?: WebSocket
  private schema?: SettingsDef
  private getter?: Getter
  private setter?: Setter
  private action?: ActionHandler
  private resources?: ResourcesHandler
  private permissions?: PermissionsHandler
  private closed = false

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
  onResources(fn: ResourcesHandler) {
    this.resources = fn
    return this
  }
  onPermissions(fn: PermissionsHandler) {
    this.permissions = fn
    return this
  }

  connect() {
    this.closed = false
    this.open()
    return this
  }

  private open() {
    const ws = new WebSocket(this.opts.gateway)
    this.ws = ws
    // handle is async: without the catch, a throw in a bot's handler would be
    // an unhandled rejection, and Node would exit the whole bot process.
    ws.on("message", (raw) => {
      this.handle(raw.toString()).catch(() => {})
    })
    ws.on("error", () => {})
    ws.on("close", () => {
      const delay = this.opts.reconnectMs ?? 1000
      if (!this.closed && delay > 0) setTimeout(() => this.open(), delay)
    })
  }

  disconnect() {
    this.closed = true
    this.ws?.close()
  }

  // Push a notification to the dashboard, such as setting.changed.
  push(method: string, params?: unknown) {
    this.send({ jsonrpc: JSONRPC_VERSION, method, params })
  }

  private send(obj: unknown) {
    this.ws?.send(JSON.stringify(obj))
  }

  private async handle(raw: string) {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return
    }
    if (!isObject(parsed)) return
    const frame = parsed

    if (frame.type === HandshakeType.Challenge) {
      const nonce = String(frame.nonce)
      const nonceSig = crypto
        .createHmac("sha256", this.opts.secret)
        .update(nonce)
        .digest("hex")
      this.send({
        jsonrpc: JSONRPC_VERSION,
        id: HandshakeType.Hello,
        method: HandshakeType.Hello,
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
      const params = isObject(frame.params) ? frame.params : undefined
      try {
        const result = await this.dispatch(frame.method, params)
        this.send({ jsonrpc: JSONRPC_VERSION, id: frame.id, result })
      } catch (err) {
        // A handler failed. Answer with a JSON-RPC error so the dashboard call
        // fails at once instead of waiting for its timeout, and keep running.
        this.send({
          jsonrpc: JSONRPC_VERSION,
          id: frame.id,
          error: {
            code: ProtocolErrorCode.InternalError,
            message: err instanceof Error ? err.message : "handler failed",
          },
        })
      }
    }
  }

  private async dispatch(method: string, params?: Record<string, unknown>) {
    const platform = params?.platform as string | undefined
    switch (method) {
      case RpcMethod.SettingsDescribe:
        return this.schema
          ? toWire(this.schema, params?.locale as string | undefined)
          : { version: WIRE_VERSION, categories: [] }
      case RpcMethod.SettingGet: {
        const value = await this.getter?.(
          String(params?.spaceId),
          String(params?.key),
          params?.actor as Actor | undefined,
          platform
        )
        return { value }
      }
      case RpcMethod.SettingSet: {
        await this.setter?.(
          String(params?.spaceId),
          String(params?.key),
          params?.value,
          params?.actor as Actor | undefined,
          platform
        )
        return { ok: true }
      }
      // Without a handler, an empty list: a picker shows nothing rather than
      // failing on a malformed answer.
      case RpcMethod.SpaceResources:
        return (
          (await this.resources?.(
            String(params?.spaceId),
            String(params?.kind),
            params?.filter as Record<string, unknown> | undefined,
            platform
          )) ?? []
        )
      case RpcMethod.SpaceMemberPermissions:
        return {
          permissions:
            (await this.permissions?.(
              String(params?.spaceId),
              String(params?.userId),
              platform
            )) ?? [],
        }
      case RpcMethod.ActionInvoke:
        return (
          (await this.action?.(
            String(params?.spaceId),
            String(params?.name),
            params?.payload,
            platform
          )) ?? null
        )
      default:
        return {}
    }
  }
}

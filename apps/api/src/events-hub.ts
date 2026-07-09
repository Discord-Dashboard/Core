import { ProtocolEvent } from "@discord-dashboard/protocol"
import type { Gateway } from "./gateway/gateway.js"

// The source id used for events the dashboard itself emits (not a bot push).
export const DASHBOARD_SOURCE = "dashboard"

export interface HubEvent {
  botId: string
  method: string
  params: unknown
}

type Listener = (event: HubEvent) => void

interface Subscription {
  guildId?: string
  fn: Listener
}

// In process pub/sub that fans bot events out to subscribed dashboard clients.
// The platform profile swaps this for Redis pub/sub behind the same shape.
export class EventHub {
  private readonly subs = new Set<Subscription>()

  subscribe(fn: Listener, guildId?: string): () => void {
    const sub: Subscription = { guildId, fn }
    this.subs.add(sub)
    return () => this.subs.delete(sub)
  }

  publish(event: HubEvent) {
    const guildId = (event.params as { guildId?: string })?.guildId
    for (const sub of this.subs) {
      if (!sub.guildId || sub.guildId === guildId) sub.fn(event)
    }
  }
}

// Forward setting changes from the gateway into the hub.
export function wireEvents(gateway: Gateway, hub: EventHub) {
  gateway.onEvent((e) => {
    if (e.method === ProtocolEvent.SettingChanged) hub.publish(e)
  })
}

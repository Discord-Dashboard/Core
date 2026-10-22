import { ProtocolEvent } from "@asctane-dashboard/protocol"
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
  spaceId?: string
  fn: Listener
}

// In process pub/sub that fans bot events out to subscribed dashboard clients.
// The platform profile swaps this for Redis pub/sub behind the same shape.
export class EventHub {
  private readonly subs = new Set<Subscription>()

  subscribe(fn: Listener, spaceId?: string): () => void {
    const sub: Subscription = { spaceId, fn }
    this.subs.add(sub)
    return () => this.subs.delete(sub)
  }

  publish(event: HubEvent) {
    const spaceId = (event.params as { spaceId?: string })?.spaceId
    for (const sub of this.subs) {
      if (!sub.spaceId || sub.spaceId === spaceId) sub.fn(event)
    }
  }
}

// Forward setting changes from the gateway into the hub.
export function wireEvents(gateway: Gateway, hub: EventHub) {
  gateway.onEvent((e) => {
    if (e.method === ProtocolEvent.SettingChanged) hub.publish(e)
  })
}

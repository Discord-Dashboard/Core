import { ProtocolEvent } from "@discord-dashboard/protocol"
import type { Gateway } from "./gateway/gateway.js"

export interface BotStats {
  guilds: number
  users: number
}

// Holds the latest stats each bot has pushed. This connects the gateway event
// stream to the http api.
export class StatsRegistry {
  private readonly map = new Map<string, BotStats>()
  record(botId: string, stats: BotStats) {
    this.map.set(botId, stats)
  }
  get(botId: string): BotStats | null {
    return this.map.get(botId) ?? null
  }
}

export function wireStats(gateway: Gateway, registry: StatsRegistry) {
  gateway.onEvent((e) => {
    if (e.method !== ProtocolEvent.StatsPush) return
    const p = (e.params ?? {}) as Partial<BotStats>
    registry.record(e.botId, {
      guilds: Number(p.guilds ?? 0),
      users: Number(p.users ?? 0),
    })
  })
}

import type { BotAdapter, SettingActor } from "./adapter.js"
import type { ChannelFilter, RoleFilter } from "@asctane-dashboard/protocol"
import { toWire, type SettingsDef } from "@asctane-dashboard/schema"
import type { SpaceSource } from "./platform.js"

export interface KeyValueStore {
  get(key: string): Promise<unknown> | unknown
  set(key: string, value: unknown): Promise<void> | void
}


export class MemoryStore implements KeyValueStore {
  private readonly map = new Map<string, unknown>()
  get(key: string) {
    return this.map.has(key) ? this.map.get(key) : null
  }
  set(key: string, value: unknown) {
    this.map.set(key, value)
  }
}

// Adapter used when the bot and dashboard share one process. Same interface as
// the remote adapter, so nothing else in the engine changes.
export class InProcessAdapter implements BotAdapter {
  constructor(
    private readonly def: SettingsDef,
    private readonly store: KeyValueStore = new MemoryStore(),
    // Live space data from the bot's own client, usually a platform's
    // source(). Left undefined, pickers return empty lists.
    private readonly source?: SpaceSource,
    private readonly actions: Record<
      string,
      (spaceId: string, payload?: unknown) => unknown
    > = {}
  ) {}

  async describeSchema(locale?: string) {
    return toWire(this.def, locale)
  }
  async getChannels(spaceId: string, filter?: ChannelFilter) {
    return (await this.source?.resources(spaceId, "channel", filter)) ?? []
  }
  async getRoles(spaceId: string, filter?: RoleFilter) {
    return (await this.source?.resources(spaceId, "role", filter)) ?? []
  }
  async getMemberPermissions(spaceId: string, userId: string) {
    return (await this.source?.memberPermissions(spaceId, userId)) ?? []
  }
  async getSetting(spaceId: string, key: string, _actor?: SettingActor) {
    return this.store.get(`${spaceId}:${key}`)
  }
  async setSetting(
    spaceId: string,
    key: string,
    value: unknown,
    _actor?: SettingActor
  ) {
    await this.store.set(`${spaceId}:${key}`, value)
    return { ok: true }
  }
  async invokeAction(spaceId: string, name: string, payload?: unknown) {
    return (await this.actions[name]?.(spaceId, payload)) ?? null
  }
}

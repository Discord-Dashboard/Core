import type { BotAdapter, SettingActor } from "./adapter.js"
import type {
  OptionListItem,
  ChannelFilter,
  RoleFilter,
} from "@discord-dashboard/protocol"
import { toWire, type SettingsDef } from "@discord-dashboard/schema"

export interface KeyValueStore {
  get(key: string): Promise<unknown> | unknown
  set(key: string, value: unknown): Promise<void> | void
}

// Optional live source of guild data. In lite mode this wraps a discord.js
// client. Left undefined, channel and role pickers just return empty lists.
export interface DiscordSource {
  channels(guildId: string, filter?: ChannelFilter): Promise<OptionListItem[]>
  roles(guildId: string, filter?: RoleFilter): Promise<OptionListItem[]>
  memberPermissions(guildId: string, userId: string): Promise<string[]>
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
    private readonly discord?: DiscordSource,
    private readonly actions: Record<
      string,
      (guildId: string, payload?: unknown) => unknown
    > = {}
  ) {}

  async describeSchema(locale?: string) {
    return toWire(this.def, locale)
  }
  async getChannels(guildId: string, filter?: ChannelFilter) {
    return (await this.discord?.channels(guildId, filter)) ?? []
  }
  async getRoles(guildId: string, filter?: RoleFilter) {
    return (await this.discord?.roles(guildId, filter)) ?? []
  }
  async getMemberPermissions(guildId: string, userId: string) {
    return (await this.discord?.memberPermissions(guildId, userId)) ?? []
  }
  async getSetting(guildId: string, key: string, _actor?: SettingActor) {
    return this.store.get(`${guildId}:${key}`)
  }
  async setSetting(
    guildId: string,
    key: string,
    value: unknown,
    _actor?: SettingActor
  ) {
    await this.store.set(`${guildId}:${key}`, value)
    return { ok: true }
  }
  async invokeAction(guildId: string, name: string, payload?: unknown) {
    return (await this.actions[name]?.(guildId, payload)) ?? null
  }
}

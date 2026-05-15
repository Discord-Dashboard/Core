import type { SchemaDescriptor } from "./wire.js"

export interface ChannelFilter {
  types?: string[]
  hideNsfw?: boolean
  onlyNsfw?: boolean
}

export interface RoleFilter {
  includeBots?: boolean
  hideHigher?: boolean
}

export interface OptionListItem {
  label: string
  value: string
}

// Methods the dashboard calls on the bot.
export interface DashboardToBot {
  "settings.describe": { params: void; result: SchemaDescriptor }
  "guild.channels": {
    params: { guildId: string; filter?: ChannelFilter }
    result: OptionListItem[]
  }
  "guild.roles": {
    params: { guildId: string; filter?: RoleFilter }
    result: OptionListItem[]
  }
  "guild.member.permissions": {
    params: { guildId: string; userId: string }
    result: { permissions: string[] }
  }
  "setting.get": {
    params: { guildId: string; key: string }
    result: { value: unknown }
  }
  "setting.set": {
    params: { guildId: string; key: string; value: unknown }
    result: { ok: boolean; error?: string }
  }
  "action.invoke": {
    params: { name: string; payload?: unknown }
    result: unknown
  }
}

// Notifications the bot pushes to the dashboard.
export interface BotToDashboard {
  "setting.changed": { guildId: string; key: string; value: unknown }
  "guild.updated": { guildId: string }
  "stats.push": { guilds: number; users: number }
  "module.event": { module: string; event: string; payload?: unknown }
}

export type MethodName = keyof DashboardToBot
export type EventName = keyof BotToDashboard

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

// The filter for a space.resources call. Which fields apply depends on the
// resource kind; a platform ignores the ones it does not understand.
export type ResourceFilter = ChannelFilter | RoleFilter | Record<string, unknown>

export interface OptionListItem {
  label: string
  value: string
}

// Methods the dashboard calls on the bot.
export interface DashboardToBot {
  "settings.describe": { params: void; result: SchemaDescriptor }
  "space.resources": {
    params: { spaceId: string; kind: string; filter?: ResourceFilter }
    result: OptionListItem[]
  }
  "space.member.permissions": {
    params: { spaceId: string; userId: string }
    result: { permissions: string[] }
  }
  "setting.get": {
    params: { spaceId: string; key: string }
    result: { value: unknown }
  }
  "setting.set": {
    params: { spaceId: string; key: string; value: unknown }
    result: { ok: boolean; error?: string }
  }
  "action.invoke": {
    params: { spaceId: string; name: string; payload?: unknown }
    result: unknown
  }
}

// Notifications the bot pushes to the dashboard.
export interface BotToDashboard {
  "setting.changed": { spaceId: string; key: string; value: unknown }
  "space.updated": { spaceId: string }
  "stats.push": { guilds: number; users: number }
  "module.event": { module: string; event: string; payload?: unknown }
}

export type MethodName = keyof DashboardToBot
export type EventName = keyof BotToDashboard

// Runtime constants for the wire method and event names, so no code hardcodes
// the strings. The values match the type keys above.
export enum RpcMethod {
  SettingsDescribe = "settings.describe",
  SpaceResources = "space.resources",
  SpaceMemberPermissions = "space.member.permissions",
  SettingGet = "setting.get",
  SettingSet = "setting.set",
  ActionInvoke = "action.invoke",
}

export enum ProtocolEvent {
  SettingChanged = "setting.changed",
  SpaceUpdated = "space.updated",
  StatsPush = "stats.push",
  ModuleEvent = "module.event",
}

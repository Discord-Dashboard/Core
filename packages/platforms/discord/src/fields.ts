import { z } from "zod"
import {
  defineField,
  f as coreF,
  type BaseFieldOpts,
  type FieldFactory,
} from "@asctane-dashboard/schema"

// The channel types a Discord channel picker can narrow to.
export type DiscordChannelType =
  | "text"
  | "voice"
  | "category"
  | "announcement"
  | "thread"
  | "stage"
  | "forum"
  | "media"

export interface ChannelFieldOpts extends BaseFieldOpts {
  types?: DiscordChannelType[]
  hideNsfw?: boolean
  onlyNsfw?: boolean
}

export interface RoleFieldOpts extends BaseFieldOpts {
  // Hide roles above the bot's own, which it could not assign anyway.
  hideHigher?: boolean
  // Include roles managed by an integration, such as other bots' roles.
  includeBots?: boolean
}

function channelFilter({ types, hideNsfw, onlyNsfw }: ChannelFieldOpts) {
  const filter = { types, hideNsfw, onlyNsfw }
  return Object.values(filter).some((v) => v !== undefined) ? filter : undefined
}

function roleFilter({ hideHigher, includeBots }: RoleFieldOpts) {
  const filter = { hideHigher, includeBots }
  return Object.values(filter).some((v) => v !== undefined) ? filter : undefined
}

function base<T extends BaseFieldOpts>(opts: T): BaseFieldOpts {
  const { label, description, required, entitlement, ui } = opts
  return { label, description, required, entitlement, ui }
}

// A Discord message embed: title, description, color, fields and so on.
const embed: FieldFactory = (opts = {}) =>
  defineField("embed", z.record(z.string(), z.unknown()).optional(), opts)

// Core's fields plus the Discord ones, with channel and role pickers typed for
// Discord. Import f from here instead of @asctane-dashboard/schema in a
// Discord bot.
export const f = {
  ...coreF,
  channel: (opts: ChannelFieldOpts = {}) =>
    coreF.ref("channel", { ...base(opts), filter: channelFilter(opts) }),
  channelMulti: (opts: ChannelFieldOpts = {}) =>
    coreF.ref("channel", { ...base(opts), multiple: true, filter: channelFilter(opts) }),
  role: (opts: RoleFieldOpts = {}) =>
    coreF.ref("role", { ...base(opts), filter: roleFilter(opts) }),
  roleMulti: (opts: RoleFieldOpts = {}) =>
    coreF.ref("role", { ...base(opts), multiple: true, filter: roleFilter(opts) }),
  embed: (opts: BaseFieldOpts & { default?: unknown } = {}) => embed(opts),
}

// The field types only Discord has, so the dashboard can rebuild them from a
// remote bot's schema.
export const discordFields: Record<string, FieldFactory> = { embed }

import type { BotAdapter, SettingActor } from "@discord-dashboard/core"
import type {
  SchemaDescriptor,
  OptionListItem,
  ChannelFilter,
  RoleFilter,
} from "@discord-dashboard/protocol"
import type { Gateway } from "./gateway.js"

// A BotAdapter backed by a bot connected over the gateway. The bot may be
// written in any language as long as it speaks the protocol.
export class RemoteAdapter implements BotAdapter {
  constructor(
    private readonly gateway: Gateway,
    private readonly botId: string
  ) {}

  describeSchema(locale?: string) {
    return this.gateway.call<SchemaDescriptor>(this.botId, "settings.describe", {
      locale,
    })
  }
  getChannels(guildId: string, filter?: ChannelFilter) {
    return this.gateway.call<OptionListItem[]>(this.botId, "guild.channels", {
      guildId,
      filter,
    })
  }
  getRoles(guildId: string, filter?: RoleFilter) {
    return this.gateway.call<OptionListItem[]>(this.botId, "guild.roles", {
      guildId,
      filter,
    })
  }
  async getMemberPermissions(guildId: string, userId: string) {
    const res = await this.gateway.call<{ permissions: string[] }>(
      this.botId,
      "guild.member.permissions",
      { guildId, userId }
    )
    return res.permissions
  }
  async getSetting(guildId: string, key: string, actor?: SettingActor) {
    const res = await this.gateway.call<{ value: unknown }>(
      this.botId,
      "setting.get",
      { guildId, key, actor }
    )
    return res.value
  }
  setSetting(guildId: string, key: string, value: unknown, actor?: SettingActor) {
    return this.gateway.call<{ ok: boolean; error?: string }>(
      this.botId,
      "setting.set",
      { guildId, key, value, actor }
    )
  }
  invokeAction(guildId: string, name: string, payload?: unknown) {
    return this.gateway.call<unknown>(this.botId, "action.invoke", {
      guildId,
      name,
      payload,
    })
  }
}

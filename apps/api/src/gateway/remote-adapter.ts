import type { BotAdapter, SettingActor } from "@discord-dashboard/core"
import {
  RpcMethod,
  type SchemaDescriptor,
  type OptionListItem,
  type ChannelFilter,
  type RoleFilter,
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
    return this.gateway.call<SchemaDescriptor>(this.botId, RpcMethod.SettingsDescribe, {
      locale,
    })
  }
  getChannels(guildId: string, filter?: ChannelFilter) {
    return this.gateway.call<OptionListItem[]>(this.botId, RpcMethod.GuildChannels, {
      guildId,
      filter,
    })
  }
  getRoles(guildId: string, filter?: RoleFilter) {
    return this.gateway.call<OptionListItem[]>(this.botId, RpcMethod.GuildRoles, {
      guildId,
      filter,
    })
  }
  async getMemberPermissions(guildId: string, userId: string) {
    const res = await this.gateway.call<{ permissions: string[] }>(
      this.botId,
      RpcMethod.GuildMemberPermissions,
      { guildId, userId }
    )
    return res.permissions
  }
  async getSetting(guildId: string, key: string, actor?: SettingActor) {
    const res = await this.gateway.call<{ value: unknown }>(
      this.botId,
      RpcMethod.SettingGet,
      { guildId, key, actor }
    )
    return res.value
  }
  setSetting(guildId: string, key: string, value: unknown, actor?: SettingActor) {
    return this.gateway.call<{ ok: boolean; error?: string }>(
      this.botId,
      RpcMethod.SettingSet,
      { guildId, key, value, actor }
    )
  }
  invokeAction(guildId: string, name: string, payload?: unknown) {
    return this.gateway.call<unknown>(this.botId, RpcMethod.ActionInvoke, {
      guildId,
      name,
      payload,
    })
  }
}

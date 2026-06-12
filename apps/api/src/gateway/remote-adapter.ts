import type { BotAdapter } from "@discord-dashboard/core"
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

  describeSchema() {
    return this.gateway.call<SchemaDescriptor>(this.botId, "settings.describe")
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
  async getSetting(guildId: string, key: string) {
    const res = await this.gateway.call<{ value: unknown }>(
      this.botId,
      "setting.get",
      { guildId, key }
    )
    return res.value
  }
  setSetting(guildId: string, key: string, value: unknown) {
    return this.gateway.call<{ ok: boolean; error?: string }>(
      this.botId,
      "setting.set",
      { guildId, key, value }
    )
  }
}

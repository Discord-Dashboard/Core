import type { BotAdapter, SettingActor } from "../../base.js"
import {
  RpcMethod,
  type SchemaDescriptor,
  type OptionListItem,
  type ChannelFilter,
  type RoleFilter,
} from "@asctane-dashboard/protocol"
import type { Gateway } from "./gateway.js"

// A BotAdapter backed by a bot connected over the gateway. The bot may be
// written in any language as long as it speaks the protocol.
export interface RemoteAdapterOptions {
  // The platform this bot serves, such as "discord". Sent with every space
  // call so a bot that serves several platforms can tell them apart.
  platform?: string
}

export class RemoteAdapter implements BotAdapter {
  constructor(
    private readonly gateway: Gateway,
    private readonly botId: string,
    private readonly options: RemoteAdapterOptions = {}
  ) {}

  private space(spaceId: string) {
    const { platform } = this.options
    return platform ? { spaceId, platform } : { spaceId }
  }

  describeSchema(locale?: string) {
    return this.gateway.call<SchemaDescriptor>(this.botId, RpcMethod.SettingsDescribe, {
      locale,
    })
  }
  getChannels(spaceId: string, filter?: ChannelFilter) {
    return this.gateway.call<OptionListItem[]>(this.botId, RpcMethod.SpaceResources, {
      ...this.space(spaceId),
      kind: "channel",
      filter,
    })
  }
  getRoles(spaceId: string, filter?: RoleFilter) {
    return this.gateway.call<OptionListItem[]>(this.botId, RpcMethod.SpaceResources, {
      ...this.space(spaceId),
      kind: "role",
      filter,
    })
  }
  async getMemberPermissions(spaceId: string, userId: string) {
    const res = await this.gateway.call<{ permissions: string[] }>(
      this.botId,
      RpcMethod.SpaceMemberPermissions,
      { ...this.space(spaceId), userId }
    )
    return res.permissions
  }
  async getSetting(spaceId: string, key: string, actor?: SettingActor) {
    const res = await this.gateway.call<{ value: unknown }>(
      this.botId,
      RpcMethod.SettingGet,
      { ...this.space(spaceId), key, actor }
    )
    return res.value
  }
  setSetting(spaceId: string, key: string, value: unknown, actor?: SettingActor) {
    return this.gateway.call<{ ok: boolean; error?: string }>(
      this.botId,
      RpcMethod.SettingSet,
      { ...this.space(spaceId), key, value, actor }
    )
  }
  invokeAction(spaceId: string, name: string, payload?: unknown) {
    return this.gateway.call<unknown>(this.botId, RpcMethod.ActionInvoke, {
      ...this.space(spaceId),
      name,
      payload,
    })
  }
}

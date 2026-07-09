import type {
  SchemaDescriptor,
  OptionListItem,
  ChannelFilter,
  RoleFilter,
} from "@discord-dashboard/protocol"

// A BotAdapter is the boundary between the dashboard and a bot. It has two
// implementations: in process (lite mode, discord.js in the same process) and
// remote (a bot connected over the gateway in any language). Both satisfy the
// same interface so the rest of the engine does not care which is used.
export interface BotAdapter {
  describeSchema(): Promise<SchemaDescriptor>
  getChannels(guildId: string, filter?: ChannelFilter): Promise<OptionListItem[]>
  getRoles(guildId: string, filter?: RoleFilter): Promise<OptionListItem[]>
  getMemberPermissions(guildId: string, userId: string): Promise<string[]>
  getSetting(guildId: string, key: string): Promise<unknown>
  setSetting(
    guildId: string,
    key: string,
    value: unknown
  ): Promise<{ ok: boolean; error?: string }>
  invokeAction(name: string, payload?: unknown): Promise<unknown>
}

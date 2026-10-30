import type {
  SchemaDescriptor,
  OptionListItem,
  ChannelFilter,
  RoleFilter,
} from "@acstane/protocol"

// Who is performing a settings operation. Threaded to the bot so it can key
// per user data correctly and record who changed a setting (updated_by).
export interface SettingActor {
  userId?: string
}

// A BotAdapter is the boundary between the dashboard and a bot. Every call is
// scoped to a space (see platform.ts). It has two
// implementations: in process (lite mode, discord.js in the same process) and
// remote (a bot connected over the gateway in any language). Both satisfy the
// same interface so the rest of the engine does not care which is used.
export interface BotAdapter {
  describeSchema(locale?: string): Promise<SchemaDescriptor>
  getChannels(spaceId: string, filter?: ChannelFilter): Promise<OptionListItem[]>
  getRoles(spaceId: string, filter?: RoleFilter): Promise<OptionListItem[]>
  getMemberPermissions(spaceId: string, userId: string): Promise<string[]>
  getSetting(spaceId: string, key: string, actor?: SettingActor): Promise<unknown>
  setSetting(
    spaceId: string,
    key: string,
    value: unknown,
    actor?: SettingActor
  ): Promise<{ ok: boolean; error?: string }>
  invokeAction(spaceId: string, name: string, payload?: unknown): Promise<unknown>
}

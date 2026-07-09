import { fromWire, type SettingsDef } from "@discord-dashboard/schema"
import type { BotAdapter } from "./adapter.js"

// Build a validating schema definition from whatever a connected bot reports.
// This is how the platform validates settings for bots written in any language:
// it does not have the bot's Zod code, only its wire descriptor.
export async function buildDefFromAdapter(
  adapter: BotAdapter,
  locale?: string
): Promise<SettingsDef> {
  return fromWire(await adapter.describeSchema(locale))
}

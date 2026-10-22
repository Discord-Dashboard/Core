import { fromWire, type FieldFactory, type SettingsDef } from "@asctane-dashboard/schema"
import type { BotAdapter } from "./adapter.js"
import type { Platform } from "./platform.js"

// Build a validating schema definition from whatever a connected bot reports.
// This is how the platform validates settings for bots written in any language:
// it does not have the bot's Zod code, only its wire descriptor. Pass the
// platforms in use so their own field types (Discord's embed) are rebuilt.
export async function buildDefFromAdapter(
  adapter: BotAdapter,
  locale?: string,
  platforms: Pick<Platform, "fields">[] = []
): Promise<SettingsDef> {
  const fields: Record<string, FieldFactory> = {}
  for (const p of platforms) Object.assign(fields, p.fields)
  return fromWire(await adapter.describeSchema(locale), fields)
}

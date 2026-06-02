import type { SettingsDef } from "@discord-dashboard/schema"
import type { BotAdapter } from "./adapter.js"
import type { Entitlements } from "./entitlements.js"

export interface SettingsContext {
  guildId: string
  userId: string
}

// Reads and writes settings through the adapter, gated by entitlements and
// validated against the declared schema. Replaces the v2 settings update route
// and its long chain of type checks.
export class SettingsService {
  constructor(
    private readonly def: SettingsDef,
    private readonly adapter: BotAdapter,
    private readonly entitlements: Entitlements
  ) {}

  private field(categoryId: string, optionId: string) {
    return this.def.categories[categoryId]?.options[optionId]
  }

  async get(ctx: SettingsContext, categoryId: string, optionId: string) {
    return this.adapter.getSetting(ctx.guildId, `${categoryId}.${optionId}`)
  }

  async set(
    ctx: SettingsContext,
    categoryId: string,
    optionId: string,
    value: unknown
  ): Promise<{ ok: boolean; error?: string }> {
    const category = this.def.categories[categoryId]
    const field = this.field(categoryId, optionId)
    if (!category || !field) return { ok: false, error: "unknown setting" }

    const gate = field.opts.entitlement ?? category.entitlement
    if (typeof gate === "string") {
      const allowed = await this.entitlements.has(
        { type: "guild", id: ctx.guildId },
        gate
      )
      if (!allowed) return { ok: false, error: "entitlement required" }
    }

    const parsed = field.zod.safeParse(value)
    if (!parsed.success) return { ok: false, error: "invalid value" }

    return this.adapter.setSetting(
      ctx.guildId,
      `${categoryId}.${optionId}`,
      parsed.data
    )
  }
}

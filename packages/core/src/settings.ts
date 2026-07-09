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
// A schema, or a function returning one. A provider supports remote bots whose
// schema can change when they reconnect.
export type DefSource = SettingsDef | (() => SettingsDef)

export class SettingsService {
  constructor(
    private readonly defSource: DefSource,
    private readonly adapter: BotAdapter,
    private readonly entitlements: Entitlements
  ) {}

  private def(): SettingsDef {
    return typeof this.defSource === "function" ? this.defSource() : this.defSource
  }

  private field(categoryId: string, optionId: string) {
    return this.def().categories[categoryId]?.options[optionId]
  }

  async get(ctx: SettingsContext, categoryId: string, optionId: string) {
    const value = await this.adapter.getSetting(
      ctx.guildId,
      `${categoryId}.${optionId}`
    )
    // Fall back to the declared default when the setting has never been set.
    if (value === null || value === undefined) {
      const fallback = this.field(categoryId, optionId)?.opts.default
      if (fallback !== undefined) return fallback
    }
    return value
  }

  async set(
    ctx: SettingsContext,
    categoryId: string,
    optionId: string,
    value: unknown
  ): Promise<{ ok: boolean; error?: string }> {
    const category = this.def().categories[categoryId]
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
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "invalid value"
      return { ok: false, error: message }
    }

    return this.adapter.setSetting(
      ctx.guildId,
      `${categoryId}.${optionId}`,
      parsed.data
    )
  }
}

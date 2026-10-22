import { SubjectType, type PlatformBilling } from "@asctane-dashboard/core"

// The parts of a Discord entitlement event that matter here.
interface DiscordEntitlement {
  guild_id?: string
  user_id?: string
  sku_id?: string
  deleted?: boolean
}

// Discord SKU purchases. A guild subscription unlocks the feature for that
// server, a user subscription for that user. The SKU id is the feature name.
export const discordBilling: PlatformBilling = {
  grantsFromWebhook(body) {
    const ent = (body ?? {}) as DiscordEntitlement
    const id = ent.guild_id ?? ent.user_id
    if (!ent.sku_id || !id) return []
    return [
      {
        subject: { type: ent.guild_id ? SubjectType.Space : SubjectType.User, id },
        feature: ent.sku_id,
        active: !ent.deleted,
      },
    ]
  },
}

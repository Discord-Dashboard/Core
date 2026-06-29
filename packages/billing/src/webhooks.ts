import type { Grant } from "./entitlements.js"

// Both billing sources reduce to the same Grant shape before they are stored.
export function grantFromStripeSubscription(sub: {
  id: string
  status: string
  metadata: { subjectType: string; subjectId: string; feature: string }
}): Grant {
  return {
    subjectType: sub.metadata.subjectType,
    subjectId: sub.metadata.subjectId,
    feature: sub.metadata.feature,
    source: "stripe",
    status: sub.status === "active" ? "active" : "canceled",
  }
}

export function grantFromDiscordEntitlement(ent: {
  guild_id?: string
  user_id?: string
  sku_id: string
  deleted?: boolean
}): Grant {
  return {
    subjectType: ent.guild_id ? "guild" : "user",
    subjectId: ent.guild_id ?? ent.user_id ?? "",
    feature: ent.sku_id,
    source: "discord",
    status: ent.deleted ? "canceled" : "active",
  }
}

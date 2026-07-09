import { SubjectType } from "@discord-dashboard/core"
import { GrantSource, GrantStatus, type Grant } from "./entitlements.js"

// The literal status the Stripe API sends for an active subscription.
const STRIPE_ACTIVE = "active"

// Both billing sources reduce to the same Grant shape before they are stored.
export function grantFromStripeSubscription(sub: {
  id: string
  status: string
  metadata?: Partial<{ subjectType: string; subjectId: string; feature: string }>
}): Grant {
  const meta = sub.metadata ?? {}
  return {
    subjectType: meta.subjectType ?? "",
    subjectId: meta.subjectId ?? "",
    feature: meta.feature ?? "",
    source: GrantSource.Stripe,
    status: sub.status === STRIPE_ACTIVE ? GrantStatus.Active : GrantStatus.Canceled,
  }
}

export function grantFromDiscordEntitlement(ent: {
  guild_id?: string
  user_id?: string
  sku_id: string
  deleted?: boolean
}): Grant {
  return {
    subjectType: ent.guild_id ? SubjectType.Guild : SubjectType.User,
    subjectId: ent.guild_id ?? ent.user_id ?? "",
    feature: ent.sku_id,
    source: GrantSource.Discord,
    status: ent.deleted ? GrantStatus.Canceled : GrantStatus.Active,
  }
}

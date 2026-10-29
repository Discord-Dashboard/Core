import { SubjectType } from "../entitlements.js"
import type { PlatformGrant } from "../platform.js"
import { GrantSource, GrantStatus, type Grant } from "./entitlements.js"

// The literal status the Stripe API sends for an active subscription.
const STRIPE_ACTIVE = "active"

// Every billing source reduces to the same Grant shape before it is stored.
// Subscriptions created before 3.1 carry subjectType "guild"; they now mean a
// space.
const LEGACY_GUILD = "guild"

function subjectTypeFromMetadata(type: string | undefined): string {
  return type === LEGACY_GUILD ? SubjectType.Space : (type ?? "")
}

export function grantFromStripeSubscription(sub: {
  id: string
  status: string
  metadata?: Partial<{ subjectType: string; subjectId: string; feature: string }>
}): Grant {
  const meta = sub.metadata ?? {}
  return {
    subjectType: subjectTypeFromMetadata(meta.subjectType),
    subjectId: meta.subjectId ?? "",
    feature: meta.feature ?? "",
    source: GrantSource.Stripe,
    status: sub.status === STRIPE_ACTIVE ? GrantStatus.Active : GrantStatus.Canceled,
  }
}

// A platform's billing hook reports what a purchase grants; this turns each
// report into a stored grant.
export function grantFromPlatform(platform: string, grant: PlatformGrant): Grant {
  return {
    subjectType: grant.subject.type,
    subjectId: grant.subject.id,
    feature: grant.feature,
    source: GrantSource.Platform,
    platform,
    status: grant.active ? GrantStatus.Active : GrantStatus.Canceled,
    ...(grant.expiresAt !== undefined ? { expiresAt: grant.expiresAt } : {}),
  }
}

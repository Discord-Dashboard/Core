import type {
  Entitlements,
  EntitlementSubject,
} from "@asctane-dashboard/core"

export enum GrantSource {
  Manual = "manual",
  // A purchase made on a chat platform, such as a Discord SKU. Grant.platform
  // says which one.
  Platform = "platform",
  Stripe = "stripe",
  Plan = "plan",
}

export enum GrantStatus {
  Active = "active",
  Canceled = "canceled",
}

export interface Grant {
  subjectType: string
  subjectId: string
  feature: string
  source: GrantSource
  // The platform id for a GrantSource.Platform grant, such as "discord".
  platform?: string
  status: GrantStatus
  expiresAt?: number
}

// Precedence: a manual grant beats a platform purchase beats a Stripe
// subscription beats a plan default. Sources are written by webhooks so the
// read path is a single query.
const PRECEDENCE: Record<GrantSource, number> = {
  [GrantSource.Manual]: 3,
  [GrantSource.Platform]: 2,
  [GrantSource.Stripe]: 1,
  [GrantSource.Plan]: 0,
}

export interface GrantStore {
  find(subject: EntitlementSubject, feature: string): Promise<Grant[]>
}

export function createEntitlements(store: GrantStore): Entitlements {
  return {
    async has(subject, feature) {
      const now = Math.floor(Date.now() / 1000)
      const grants = (await store.find(subject, feature))
        // A user and a space can share the same snowflake, so the type must
        // match too. Otherwise a user grant could satisfy a space check.
        .filter((g) => g.subjectType === subject.type)
        .filter((g) => g.status === GrantStatus.Active)
        .filter((g) => !g.expiresAt || g.expiresAt > now)
        .sort((a, b) => PRECEDENCE[b.source] - PRECEDENCE[a.source])
      return grants.length > 0
    },
  }
}

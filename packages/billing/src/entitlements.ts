import type {
  Entitlements,
  EntitlementSubject,
} from "@discord-dashboard/core"

export enum GrantSource {
  Manual = "manual",
  Discord = "discord",
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
  status: GrantStatus
  expiresAt?: number
}

// Precedence: a manual grant beats a Discord entitlement beats a Stripe
// subscription beats a plan default. Sources are written by webhooks so the
// read path is a single query.
const PRECEDENCE: Record<GrantSource, number> = {
  [GrantSource.Manual]: 3,
  [GrantSource.Discord]: 2,
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
        // A user and a guild can share the same snowflake, so the type must
        // match too. Otherwise a user grant could satisfy a guild check.
        .filter((g) => g.subjectType === subject.type)
        .filter((g) => g.status === GrantStatus.Active)
        .filter((g) => !g.expiresAt || g.expiresAt > now)
        .sort((a, b) => PRECEDENCE[b.source] - PRECEDENCE[a.source])
      return grants.length > 0
    },
  }
}

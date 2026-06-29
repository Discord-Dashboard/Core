import type {
  Entitlements,
  EntitlementSubject,
} from "@discord-dashboard/core"

export type Source = "manual" | "discord" | "stripe" | "plan"

export interface Grant {
  subjectType: string
  subjectId: string
  feature: string
  source: Source
  status: "active" | "canceled"
  expiresAt?: number
}

// Precedence: a manual grant beats a Discord entitlement beats a Stripe
// subscription beats a plan default. Sources are written by webhooks so the
// read path is a single query.
const PRECEDENCE: Record<Source, number> = {
  manual: 3,
  discord: 2,
  stripe: 1,
  plan: 0,
}

export interface GrantStore {
  find(subject: EntitlementSubject, feature: string): Promise<Grant[]>
}

export function createEntitlements(store: GrantStore): Entitlements {
  return {
    async has(subject, feature) {
      const now = Math.floor(Date.now() / 1000)
      const grants = (await store.find(subject, feature))
        .filter((g) => g.status === "active")
        .filter((g) => !g.expiresAt || g.expiresAt > now)
        .sort((a, b) => PRECEDENCE[b.source] - PRECEDENCE[a.source])
      return grants.length > 0
    },
  }
}

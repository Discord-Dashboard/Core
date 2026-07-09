import type { EntitlementSubject } from "@discord-dashboard/core"
import type { Grant, GrantStore } from "@discord-dashboard/billing"

// In memory grant store for lite mode. The platform profile swaps this for a
// database backed store behind the same interface.
export class MemoryGrantStore implements GrantStore {
  private readonly grants: Grant[] = []

  add(grant: Grant) {
    // Upsert on the grant's identity so a later webhook (for example a
    // cancellation) replaces the earlier one instead of leaving a stale active
    // grant behind, which would keep access alive after it was revoked. This
    // also makes redelivered webhooks idempotent.
    const i = this.grants.findIndex(
      (g) =>
        g.subjectType === grant.subjectType &&
        g.subjectId === grant.subjectId &&
        g.feature === grant.feature &&
        g.source === grant.source
    )
    if (i >= 0) this.grants[i] = grant
    else this.grants.push(grant)
  }

  async find(subject: EntitlementSubject, feature: string) {
    return this.grants.filter(
      (g) =>
        g.subjectType === subject.type &&
        g.subjectId === subject.id &&
        g.feature === feature
    )
  }
}

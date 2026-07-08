import type { EntitlementSubject } from "@discord-dashboard/core"
import type { Grant, GrantStore } from "@discord-dashboard/billing"

// In memory grant store for lite mode. The platform profile swaps this for a
// database backed store behind the same interface.
export class MemoryGrantStore implements GrantStore {
  private readonly grants: Grant[] = []

  add(grant: Grant) {
    this.grants.push(grant)
  }

  async find(subject: EntitlementSubject, feature: string) {
    return this.grants.filter(
      (g) => g.subjectId === subject.id && g.feature === feature
    )
  }
}

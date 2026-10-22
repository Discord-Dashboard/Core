export interface AuditEntry {
  spaceId: string
  userId: string
  key: string
  value: unknown
  at: number
}

// Records who changed which setting and when. Lite mode keeps a bounded window
// per space in memory; the platform profile writes to the audit_log table
// behind the same interface. This is the foundation for the config as data /
// compliance story.
export class AuditLog {
  // Kept per space so a busy space cannot evict another space's history.
  private readonly bySpace = new Map<string, AuditEntry[]>()

  constructor(
    private readonly perSpaceLimit = 1000,
    private readonly clock: () => number = () => Date.now()
  ) {}

  record(entry: Omit<AuditEntry, "at">) {
    const list = this.bySpace.get(entry.spaceId) ?? []
    list.push({ ...entry, at: this.clock() })
    if (list.length > this.perSpaceLimit) {
      list.splice(0, list.length - this.perSpaceLimit)
    }
    this.bySpace.set(entry.spaceId, list)
  }

  // Most recent entries for a space, newest first.
  list(spaceId: string, max = 100): AuditEntry[] {
    const list = this.bySpace.get(spaceId) ?? []
    return list.slice(-max).reverse()
  }
}

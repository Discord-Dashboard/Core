export interface AuditEntry {
  guildId: string
  userId: string
  key: string
  value: unknown
  at: number
}

// Records who changed which setting and when. Lite mode keeps a bounded window
// in memory; the platform profile writes to the audit_log table behind the same
// interface. This is the foundation for the config as data / compliance story.
export class AuditLog {
  private readonly entries: AuditEntry[] = []

  constructor(
    private readonly limit = 1000,
    private readonly clock: () => number = () => Date.now()
  ) {}

  record(entry: Omit<AuditEntry, "at">) {
    this.entries.push({ ...entry, at: this.clock() })
    // Keep only the most recent entries so the log cannot grow without bound.
    if (this.entries.length > this.limit) {
      this.entries.splice(0, this.entries.length - this.limit)
    }
  }

  // Most recent entries for a guild, newest first.
  list(guildId: string, max = 100): AuditEntry[] {
    const out: AuditEntry[] = []
    for (let i = this.entries.length - 1; i >= 0 && out.length < max; i--) {
      const entry = this.entries[i]!
      if (entry.guildId === guildId) out.push(entry)
    }
    return out
  }
}

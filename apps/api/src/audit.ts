export interface AuditEntry {
  guildId: string
  userId: string
  key: string
  value: unknown
  at: number
}

// Records who changed which setting and when. Lite mode keeps a bounded window
// per guild in memory; the platform profile writes to the audit_log table
// behind the same interface. This is the foundation for the config as data /
// compliance story.
export class AuditLog {
  // Kept per guild so a busy guild cannot evict another guild's history.
  private readonly byGuild = new Map<string, AuditEntry[]>()

  constructor(
    private readonly perGuildLimit = 1000,
    private readonly clock: () => number = () => Date.now()
  ) {}

  record(entry: Omit<AuditEntry, "at">) {
    const list = this.byGuild.get(entry.guildId) ?? []
    list.push({ ...entry, at: this.clock() })
    if (list.length > this.perGuildLimit) {
      list.splice(0, list.length - this.perGuildLimit)
    }
    this.byGuild.set(entry.guildId, list)
  }

  // Most recent entries for a guild, newest first.
  list(guildId: string, max = 100): AuditEntry[] {
    const list = this.byGuild.get(guildId) ?? []
    return list.slice(-max).reverse()
  }
}

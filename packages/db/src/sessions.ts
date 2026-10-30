import crypto from "node:crypto"
import Database from "better-sqlite3"

// Logged in dashboard sessions in SQLite, so a restart doesn't log everyone
// out. It fits core's SessionBackend. Session ids are bearer secrets, so only
// their SHA-256 is stored: a copy of the file can't be turned into a cookie.
export class SqliteSessionBackend {
  private readonly db: Database.Database
  private readonly getStmt: Database.Statement
  private readonly setStmt: Database.Statement
  private readonly deleteStmt: Database.Statement
  private readonly sweepStmt: Database.Statement

  constructor(path = "data.sqlite") {
    this.db = new Database(path)
    this.db.pragma("journal_mode = WAL")
    this.db.exec(
      "CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, data TEXT NOT NULL, expires_at INTEGER NOT NULL)"
    )
    this.getStmt = this.db.prepare("SELECT data, expires_at FROM sessions WHERE id = ?")
    this.setStmt = this.db.prepare(
      "INSERT INTO sessions (id, data, expires_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, expires_at = excluded.expires_at"
    )
    this.deleteStmt = this.db.prepare("DELETE FROM sessions WHERE id = ?")
    this.sweepStmt = this.db.prepare("DELETE FROM sessions WHERE expires_at <= ?")
  }

  get(id: string): { data: Record<string, unknown>; expiresAt: number } | undefined {
    const row = this.getStmt.get(hash(id)) as { data: string; expires_at: number } | undefined
    return row ? { data: JSON.parse(row.data), expiresAt: row.expires_at } : undefined
  }

  set(id: string, data: object, expiresAt: number): void {
    this.setStmt.run(hash(id), JSON.stringify(data), expiresAt)
  }

  delete(id: string): void {
    this.deleteStmt.run(hash(id))
  }

  sweep(now: number): void {
    this.sweepStmt.run(now)
  }

  close() {
    this.db.close()
  }
}

function hash(id: string): string {
  return crypto.createHash("sha256").update(id).digest("hex")
}

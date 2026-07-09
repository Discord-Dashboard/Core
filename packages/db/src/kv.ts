import Database from "better-sqlite3"

// A durable key value store backed by SQLite. It satisfies the same shape as the
// in memory store, so lite mode can persist settings across restarts just by
// swapping the store. Keys are the engine's `${guildId}:${key}` strings and
// values are stored as JSON.
export class SqliteKeyValueStore {
  private readonly db: Database.Database
  private readonly getStmt: Database.Statement
  private readonly setStmt: Database.Statement

  constructor(path = "data.sqlite") {
    this.db = new Database(path)
    this.db.pragma("journal_mode = WAL")
    this.db.exec(
      "CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)"
    )
    this.getStmt = this.db.prepare("SELECT v FROM kv WHERE k = ?")
    this.setStmt = this.db.prepare(
      "INSERT INTO kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v"
    )
  }

  get(key: string): unknown {
    const row = this.getStmt.get(key) as { v: string } | undefined
    return row ? JSON.parse(row.v) : null
  }

  set(key: string, value: unknown): void {
    this.setStmt.run(key, JSON.stringify(value))
  }

  close() {
    this.db.close()
  }
}

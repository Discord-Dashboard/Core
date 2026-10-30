import { fileURLToPath } from "node:url"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import Database from "better-sqlite3"
import * as schema from "./schema.js"

export * from "./schema.js"
export { SqliteKeyValueStore } from "./kv.js"
export { SqliteSessionBackend } from "./sessions.js"

// Lite mode uses SQLite. The platform profile swaps this for a Postgres driver
// behind the same schema.
export function createDb(path = "data.sqlite") {
  const sqlite = new Database(path)
  return drizzle(sqlite, { schema })
}

export type Db = ReturnType<typeof createDb>

// The generated SQL migrations ship with the package, next to src and dist.
export const MIGRATIONS_FOLDER = fileURLToPath(new URL("../migrations", import.meta.url))

// Creates or updates the tables. Safe to run on every start: applied
// migrations are recorded and skipped.
export function migrateDb(db: Db) {
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
}

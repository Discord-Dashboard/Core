import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import * as schema from "./schema.js"

export * from "./schema.js"
export { SqliteKeyValueStore } from "./kv.js"

// Lite mode uses SQLite. The platform profile swaps this for a Postgres driver
// behind the same schema.
export function createDb(path = "data.sqlite") {
  const sqlite = new Database(path)
  return drizzle(sqlite, { schema })
}

export type Db = ReturnType<typeof createDb>

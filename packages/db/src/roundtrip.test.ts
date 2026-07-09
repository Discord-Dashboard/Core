import { describe, it, expect } from "vitest"
import { sql } from "drizzle-orm"
import { createDb, guildSettings } from "./index.js"

describe("db round trip", () => {
  it("inserts and reads a guild setting via drizzle", () => {
    const db = createDb(":memory:")
    db.run(
      sql`CREATE TABLE guild_settings (bot_id text, guild_id text, key text, value_json text, updated_by text, updated_at integer)`
    )
    db.insert(guildSettings)
      .values({ botId: "b", guildId: "g", key: "general.prefix", valueJson: JSON.stringify("!") })
      .run()
    const rows = db.select().from(guildSettings).all()
    expect(rows).toHaveLength(1)
    expect(rows[0]!.key).toBe("general.prefix")
    expect(JSON.parse(rows[0]!.valueJson!)).toBe("!")
  })

  it("upserts on the composite key rather than duplicating a setting", () => {
    const db = createDb(":memory:")
    db.run(
      sql`CREATE TABLE guild_settings (bot_id text, guild_id text, key text, value_json text, updated_by text, updated_at integer, PRIMARY KEY (bot_id, guild_id, key))`
    )
    const target = [guildSettings.botId, guildSettings.guildId, guildSettings.key]
    const base = { botId: "b", guildId: "g", key: "general.prefix" }
    db.insert(guildSettings).values({ ...base, valueJson: JSON.stringify("!") }).run()
    db.insert(guildSettings)
      .values({ ...base, valueJson: JSON.stringify("?") })
      .onConflictDoUpdate({ target, set: { valueJson: JSON.stringify("?") } })
      .run()
    const rows = db.select().from(guildSettings).all()
    expect(rows).toHaveLength(1)
    expect(JSON.parse(rows[0]!.valueJson!)).toBe("?")
  })
})

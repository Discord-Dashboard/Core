import { describe, it, expect } from "vitest"
import { createDb, migrateDb, spaceSettings } from "./index.js"

function migrated() {
  const db = createDb(":memory:")
  migrateDb(db)
  return db
}

describe("db round trip", () => {
  it("inserts and reads a space setting on the migrated schema", () => {
    const db = migrated()
    db.insert(spaceSettings)
      .values({
        botId: "b",
        platform: "discord",
        spaceId: "g",
        key: "general.prefix",
        valueJson: JSON.stringify("!"),
      })
      .run()
    const rows = db.select().from(spaceSettings).all()
    expect(rows).toHaveLength(1)
    expect(rows[0]!.platform).toBe("discord")
    expect(JSON.parse(rows[0]!.valueJson!)).toBe("!")
  })

  it("upserts on the composite key rather than duplicating a setting", () => {
    const db = migrated()
    const target = [
      spaceSettings.botId,
      spaceSettings.platform,
      spaceSettings.spaceId,
      spaceSettings.key,
    ]
    const base = { botId: "b", platform: "discord", spaceId: "g", key: "general.prefix" }
    db.insert(spaceSettings).values({ ...base, valueJson: JSON.stringify("!") }).run()
    db.insert(spaceSettings)
      .values({ ...base, valueJson: JSON.stringify("?") })
      .onConflictDoUpdate({ target, set: { valueJson: JSON.stringify("?") } })
      .run()
    const rows = db.select().from(spaceSettings).all()
    expect(rows).toHaveLength(1)
    expect(JSON.parse(rows[0]!.valueJson!)).toBe("?")
  })

  it("keeps the same space id on two platforms apart", () => {
    const db = migrated()
    const row = { botId: "b", spaceId: "123", key: "general.prefix" }
    db.insert(spaceSettings).values({ ...row, platform: "discord", valueJson: '"!"' }).run()
    db.insert(spaceSettings).values({ ...row, platform: "slack", valueJson: '"?"' }).run()
    expect(db.select().from(spaceSettings).all()).toHaveLength(2)
  })

  it("can run the migrations twice", () => {
    const db = migrated()
    expect(() => migrateDb(db)).not.toThrow()
  })
})

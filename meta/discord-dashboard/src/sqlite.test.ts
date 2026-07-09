import { describe, it, expect } from "vitest"
import { InProcessAdapter } from "@discord-dashboard/core"
import { SqliteKeyValueStore } from "@discord-dashboard/db"
import { defineSettings, f } from "@discord-dashboard/schema"

// Proves the SQLite store works as the engine's persistence, so lite mode can
// keep settings across restarts instead of losing them with the in memory store.
describe("sqlite persistence in lite mode", () => {
  it("round trips a setting through the engine and the sqlite store", async () => {
    const def = defineSettings((s) => ({
      general: s.category({ name: "General", options: { prefix: f.text({ max: 3 }) } }),
    }))
    const store = new SqliteKeyValueStore(":memory:")
    const adapter = new InProcessAdapter(def, store)
    await adapter.setSetting("g", "general.prefix", "!")
    expect(await adapter.getSetting("g", "general.prefix")).toBe("!")
    store.close()
  })
})

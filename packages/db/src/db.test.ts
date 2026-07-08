import { describe, it, expect } from "vitest"
import { createDb, guildSettings, entitlements, bots } from "./index.js"

describe("db", () => {
  it("creates an in memory database", () => {
    const db = createDb(":memory:")
    expect(db).toBeTruthy()
  })
  it("defines the core tables", () => {
    expect(guildSettings).toBeDefined()
    expect(entitlements).toBeDefined()
    expect(bots).toBeDefined()
  })
})

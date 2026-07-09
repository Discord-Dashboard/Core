import { describe, it, expect } from "vitest"
import { modules } from "./index.js"
import { toWire } from "@discord-dashboard/schema"

describe("reference modules", () => {
  it("all have unique ids", () => {
    const ids = modules.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it("all serialize to a non empty wire descriptor", () => {
    for (const m of modules) {
      const wire = toWire(m.settings)
      expect(wire.categories.length).toBeGreaterThan(0)
      expect(wire.categories[0]!.options.length).toBeGreaterThan(0)
    }
  })
})

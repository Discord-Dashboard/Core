import { describe, it, expect } from "vitest"
import { modules, composeModules } from "./index.js"
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

describe("composeModules", () => {
  it("merges every module's categories into one schema", () => {
    const composed = composeModules(modules)
    const total = modules.reduce(
      (n, m) => n + Object.keys(m.settings.categories).length,
      0
    )
    expect(Object.keys(composed.categories)).toHaveLength(total)
    // The composed schema serializes like any other.
    expect(toWire(composed).categories.length).toBe(total)
  })
  it("throws on a duplicate category id", () => {
    expect(() => composeModules([leveling, leveling])).toThrow(/duplicate/)
  })
})

import { leveling } from "@discord-dashboard/module-leveling"

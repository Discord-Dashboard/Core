import { describe, it, expect } from "vitest"
import { leveling } from "./index.js"
import { toWire } from "@discord-dashboard/schema"

describe("leveling module", () => {
  it("exposes an id and a settings schema", () => {
    expect(leveling.id).toBe("leveling")
    expect(leveling.settings.categories).toBeDefined()
  })
  it("serializes its settings to a wire descriptor", () => {
    const wire = toWire(leveling.settings)
    expect(wire.categories.length).toBeGreaterThan(0)
    expect(wire.categories[0]!.options.length).toBeGreaterThan(0)
  })
})

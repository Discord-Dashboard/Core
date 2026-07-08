import { describe, it, expect } from "vitest"
import { automod } from "./index.js"
import { toWire } from "@discord-dashboard/schema"

describe("automod module", () => {
  it("exposes an id and a settings schema", () => {
    expect(automod.id).toBe("automod")
    expect(automod.settings.categories).toBeDefined()
  })
  it("serializes its settings to a wire descriptor", () => {
    const wire = toWire(automod.settings)
    expect(wire.categories.length).toBeGreaterThan(0)
    expect(wire.categories[0]!.options.length).toBeGreaterThan(0)
  })
})

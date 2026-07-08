import { describe, it, expect } from "vitest"
import { giveaways } from "./index.js"
import { toWire } from "@discord-dashboard/schema"

describe("giveaways module", () => {
  it("exposes an id and a settings schema", () => {
    expect(giveaways.id).toBe("giveaways")
    expect(giveaways.settings.categories).toBeDefined()
  })
  it("serializes its settings to a wire descriptor", () => {
    const wire = toWire(giveaways.settings)
    expect(wire.categories.length).toBeGreaterThan(0)
    expect(wire.categories[0]!.options.length).toBeGreaterThan(0)
  })
})

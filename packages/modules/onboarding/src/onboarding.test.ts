import { describe, it, expect } from "vitest"
import { onboarding } from "./index.js"
import { toWire } from "@discord-dashboard/schema"

describe("onboarding module", () => {
  it("exposes an id and a settings schema", () => {
    expect(onboarding.id).toBe("onboarding")
    expect(onboarding.settings.categories).toBeDefined()
  })
  it("serializes its settings to a wire descriptor", () => {
    const wire = toWire(onboarding.settings)
    expect(wire.categories.length).toBeGreaterThan(0)
    expect(wire.categories[0]!.options.length).toBeGreaterThan(0)
  })
})

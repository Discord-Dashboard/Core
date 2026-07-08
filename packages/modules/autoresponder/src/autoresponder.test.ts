import { describe, it, expect } from "vitest"
import { autoresponder } from "./index.js"
import { toWire } from "@discord-dashboard/schema"

describe("autoresponder module", () => {
  it("has an id and settings", () => {
    expect(autoresponder.id).toBe("autoresponder")
    const wire = toWire(autoresponder.settings)
    expect(wire.categories[0]!.options.length).toBeGreaterThan(0)
  })
})

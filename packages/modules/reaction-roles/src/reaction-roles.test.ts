import { describe, it, expect } from "vitest"
import { reactionRoles } from "./index.js"
import { toWire } from "@discord-dashboard/schema"

describe("reaction-roles module", () => {
  it("has an id and settings", () => {
    expect(reactionRoles.id).toBe("reaction-roles")
    const wire = toWire(reactionRoles.settings)
    expect(wire.categories[0]!.options.length).toBeGreaterThan(0)
  })
})

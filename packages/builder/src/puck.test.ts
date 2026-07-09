import { describe, it, expect } from "vitest"
import { COMPONENT_TYPES } from "./schema.js"
import { puckConfig } from "./puck.js"

describe("builder component consistency", () => {
  it("defines a render for every whitelisted component", () => {
    const defined = Object.keys(puckConfig.components)
    for (const type of COMPONENT_TYPES) {
      expect(defined).toContain(type)
    }
  })
})

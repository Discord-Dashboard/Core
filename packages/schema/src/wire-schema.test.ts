import { describe, it, expect } from "vitest"
import { defineSettings, f } from "./index.js"
import { toWire } from "./wire.js"
import { wireDescriptor } from "./wire-schema.js"

describe("wire contract", () => {
  it("toWire output conforms to the wire descriptor schema", () => {
    const def = defineSettings((s) => ({
      mod: s.category({
        name: "Mod",
        icon: "shield",
        entitlement: "pro",
        options: {
          on: f.switch({ label: "On", default: true }),
          level: f.select({ options: { off: "Off", high: "High" } }),
          words: f.list(f.text(), { label: "Words", max: 10 }),
        },
      }),
    }))
    const wire = toWire(def)
    expect(wireDescriptor.safeParse(wire).success).toBe(true)
  })
  it("rejects a malformed descriptor", () => {
    expect(wireDescriptor.safeParse({ version: 1, categories: "nope" }).success).toBe(false)
  })
})

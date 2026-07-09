import { describe, it, expect } from "vitest"
import { defineSettings, f } from "./index.js"
import { toWire } from "./wire.js"
import { fromWire } from "./from-wire.js"

describe("fromWire", () => {
  it("round trips a schema through the wire format", () => {
    const def = defineSettings((s) => ({
      general: s.category({
        name: "General",
        entitlement: "pro",
        options: {
          prefix: f.text({ label: "Prefix", max: 3 }),
          level: f.select({ options: { off: "Off", high: "High" } }),
          enabled: f.switch({ label: "On" }),
        },
      }),
    }))
    const wire = toWire(def)
    const rebuilt = toWire(fromWire(wire))
    expect(rebuilt).toEqual(wire)
  })

  it("rebuilt fields still validate", () => {
    const wire = toWire(
      defineSettings((s) => ({
        c: s.category({ name: "C", options: { p: f.text({ max: 2 }) } }),
      }))
    )
    const rebuilt = fromWire(wire)
    const field = rebuilt.categories["c"]!.options["p"]!
    expect(field.zod.safeParse("ok").success).toBe(true)
    expect(field.zod.safeParse("toolong").success).toBe(false)
  })
})

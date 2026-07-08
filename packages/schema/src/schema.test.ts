import { describe, it, expect } from "vitest"
import { defineSettings, f } from "./index.js"
import { toWire } from "./wire.js"

describe("schema fields", () => {
  it("switch validates booleans and applies the default", () => {
    const field = f.switch({ default: true })
    expect(field.type).toBe("switch")
    expect(field.zod.parse(undefined)).toBe(true)
    expect(field.zod.parse(false)).toBe(false)
  })
  it("text enforces max length", () => {
    const field = f.text({ max: 3 })
    expect(field.zod.safeParse("ok").success).toBe(true)
    expect(field.zod.safeParse("toolong").success).toBe(false)
  })
})

describe("toWire", () => {
  it("serializes categories, entitlement and enum", () => {
    const def = defineSettings((s) => ({
      mod: s.category({
        name: "Mod",
        entitlement: "pro",
        options: {
          level: f.select({ options: { off: "Off", high: "High" }, default: "off" }),
        },
      }),
    }))
    const wire = toWire(def)
    expect(wire.categories[0]!.id).toBe("mod")
    expect(wire.categories[0]!.entitlement).toBe("pro")
    const opt = wire.categories[0]!.options[0]!
    expect(opt.type).toBe("select")
    expect(opt.enum).toEqual([
      { value: "off", label: "Off" },
      { value: "high", label: "High" },
    ])
  })
})

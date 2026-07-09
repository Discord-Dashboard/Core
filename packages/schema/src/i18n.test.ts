import { describe, it, expect } from "vitest"
import { defineSettings, f } from "./index.js"
import { toWire } from "./wire.js"

const def = defineSettings((s) => ({
  general: s.category({
    name: { en: "General", pl: "Ogolne" },
    options: {
      prefix: f.text({ label: { en: "Prefix", pl: "Prefiks" } }),
    },
  }),
}))

describe("localized labels", () => {
  it("resolves to the requested locale", () => {
    const pl = toWire(def, "pl")
    expect(pl.categories[0]!.name).toBe("Ogolne")
    expect(pl.categories[0]!.options[0]!.label).toBe("Prefiks")
  })
  it("falls back to english when a locale is missing", () => {
    const de = toWire(def, "de")
    expect(de.categories[0]!.name).toBe("General")
    expect(de.categories[0]!.options[0]!.label).toBe("Prefix")
  })
  it("still accepts plain strings", () => {
    const plain = defineSettings((s) => ({
      c: s.category({ name: "Cat", options: { o: f.text({ label: "Opt" }) } }),
    }))
    const wire = toWire(plain, "pl")
    expect(wire.categories[0]!.name).toBe("Cat")
    expect(wire.categories[0]!.options[0]!.label).toBe("Opt")
  })
})

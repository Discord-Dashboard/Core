import { describe, it, expect } from "vitest"
import { f } from "./index.js"

describe("field validation coverage", () => {
  it("number respects min and max", () => {
    const n = f.number({ min: 1, max: 10 })
    expect(n.zod.safeParse(5).success).toBe(true)
    expect(n.zod.safeParse(0).success).toBe(false)
    expect(n.zod.safeParse(11).success).toBe(false)
  })
  it("checkbox defaults to false", () => {
    expect(f.checkbox().zod.parse(undefined)).toBe(false)
  })
  it("multiSelect accepts a string array", () => {
    const m = f.multiSelect({ options: { a: "A", b: "B" } })
    expect(m.zod.safeParse(["a", "b"]).success).toBe(true)
    expect(m.zod.safeParse("a").success).toBe(false)
  })
  it("list validates each item with the item schema", () => {
    const l = f.list(f.text({ max: 2 }))
    expect(l.zod.safeParse(["ok", "hi"]).success).toBe(true)
    expect(l.zod.safeParse(["toolong"]).success).toBe(false)
  })
  it("roleMulti and channelMulti expect arrays", () => {
    expect(f.roleMulti().zod.safeParse(["1", "2"]).success).toBe(true)
    expect(f.channelMulti().zod.safeParse("nope").success).toBe(false)
  })
  it("color and textarea accept strings", () => {
    expect(f.color().zod.safeParse("#fff").success).toBe(true)
    expect(f.textarea().zod.safeParse("hello").success).toBe(true)
  })
})

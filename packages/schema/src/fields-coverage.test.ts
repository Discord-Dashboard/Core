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

import { describe as d4, it as i4, expect as e4 } from "vitest"
import { f as f4 } from "./index.js"

d4("url and duration fields", () => {
  i4("url accepts http urls and rejects junk", () => {
    e4(f4.url().zod.safeParse("https://example.com").success).toBe(true)
    e4(f4.url().zod.safeParse("not a url").success).toBe(false)
  })
  i4("duration accepts shorthand and rejects bad units", () => {
    e4(f4.duration().zod.safeParse("10m").success).toBe(true)
    e4(f4.duration().zod.safeParse("2h").success).toBe(true)
    e4(f4.duration().zod.safeParse("10x").success).toBe(false)
  })
})

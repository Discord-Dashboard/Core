import { describe, it, expect } from "vitest"
import { z } from "zod"
import { defineField, defineSettings, f } from "./index.js"
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

  it("rebuilds a list field as an array, not a string", () => {
    const wire = toWire(
      defineSettings((s) => ({
        c: s.category({
          name: "C",
          options: { words: f.list(f.text(), { label: "Words" }) },
        }),
      }))
    )
    const field = fromWire(wire).categories["c"]!.options["words"]!
    expect(field.type).toBe("list")
    expect(field.zod.safeParse(["a", "b"]).success).toBe(true)
    expect(field.zod.safeParse("nope").success).toBe(false)
  })

  it("rebuilds a platform field type from the factories passed in", () => {
    const embed = (opts: object) =>
      defineField("embed", z.record(z.string(), z.unknown()).optional(), opts)
    const wire = toWire(
      defineSettings((s) => ({
        c: s.category({ name: "C", options: { e: embed({}) } }),
      }))
    )
    const field = fromWire(wire, { embed }).categories["c"]!.options["e"]!
    expect(field.type).toBe("embed")
    expect(field.zod.safeParse({ title: "hi" }).success).toBe(true)
  })

  it("round trips a ref field with its kind, multiple and filter", () => {
    const wire = toWire(
      defineSettings((s) => ({
        c: s.category({
          name: "C",
          options: { log: f.ref("channel", { multiple: true, filter: { types: ["text"] } }) },
        }),
      }))
    )
    const option = wire.categories[0]!.options[0]!
    expect(option).toMatchObject({ type: "ref", kind: "channel", multiple: true, filter: { types: ["text"] } })
    const field = fromWire(wire).categories["c"]!.options["log"]!
    expect(field.opts).toMatchObject({ kind: "channel", multiple: true, filter: { types: ["text"] } })
    expect(field.zod.safeParse(["1"]).success).toBe(true)
    expect(field.zod.safeParse("1").success).toBe(false)
  })

  it("reads the older channel and roleMulti wire types as refs", () => {
    const def = fromWire({
      version: "1.0",
      categories: [
        {
          id: "c",
          name: "C",
          options: [
            { id: "log", type: "channel" },
            { id: "mods", type: "roleMulti" },
          ],
        },
      ],
    })
    const { log, mods } = def.categories["c"]!.options
    expect(log!.opts).toMatchObject({ kind: "channel" })
    expect(mods!.opts).toMatchObject({ kind: "role", multiple: true })
  })

  it("coerces a string switch default from the wire to a boolean", () => {
    // A bot in another language may send default as the string "false".
    const field = fromWire({
      version: "1.0",
      categories: [
        { id: "c", name: "C", options: [{ id: "on", type: "switch", default: "false" }] },
      ],
    }).categories["c"]!.options["on"]!
    expect(field.zod.parse(undefined)).toBe(false)
  })
})

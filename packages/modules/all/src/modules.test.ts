import { describe, it, expect } from "vitest"
import { modules, composeModules, modulesFor, canRun } from "./index.js"
import { toWire } from "@acstane/schema"

describe("reference modules", () => {
  it("all have unique ids", () => {
    const ids = modules.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it("all serialize to a non empty wire descriptor", () => {
    for (const m of modules) {
      const wire = toWire(m.settings)
      expect(wire.categories.length).toBeGreaterThan(0)
      expect(wire.categories[0]!.options.length).toBeGreaterThan(0)
    }
  })
})

describe("platform needs", () => {
  const discord = { id: "discord", resources: ["channel", "role"] }
  const slack = { id: "slack", resources: ["channel", "role"] }
  const telegram = { id: "telegram", resources: ["channel"] }

  it("every module declares the resources it picks", () => {
    for (const m of modules) {
      expect(m.requires?.length, m.id).toBeGreaterThan(0)
    }
  })
  it("Discord runs every module", () => {
    expect(modulesFor(modules, discord)).toHaveLength(modules.length)
  })
  it("hides Discord only modules on another platform", () => {
    const ids = modulesFor(modules, slack).map((m) => m.id)
    expect(ids).not.toContain("tickets")
    expect(ids).not.toContain("reaction-roles")
    expect(ids).toContain("leveling")
  })
  it("hides modules that need a resource the platform lacks", () => {
    expect(canRun(leveling, telegram)).toBe(false)
    expect(modulesFor(modules, telegram).map((m) => m.id).sort()).toEqual([
      "automod",
      "autoresponder",
    ])
  })
})

describe("composeModules", () => {
  it("merges every module's categories into one schema", () => {
    const composed = composeModules(modules)
    const total = modules.reduce(
      (n, m) => n + Object.keys(m.settings.categories).length,
      0
    )
    expect(Object.keys(composed.categories)).toHaveLength(total)
    // The composed schema serializes like any other.
    expect(toWire(composed).categories.length).toBe(total)
  })
  it("leaves out modules the platform cannot run", () => {
    const telegram = { id: "telegram", resources: ["channel"] }
    const composed = composeModules(modules, { platform: telegram })
    expect(Object.keys(composed.categories).sort()).toEqual(["automod", "autoresponder"])
  })
  it("throws on a duplicate category id", () => {
    expect(() => composeModules([leveling, leveling])).toThrow(/duplicate/)
  })
})

import { leveling } from "@acstane/module-leveling"

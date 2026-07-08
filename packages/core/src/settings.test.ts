import { describe, it, expect } from "vitest"
import { SettingsService } from "./settings.js"
import { InProcessAdapter, MemoryStore } from "./inprocess.js"
import { AllowAll, type Entitlements } from "./entitlements.js"
import { defineSettings, f } from "@discord-dashboard/schema"

const def = defineSettings((s) => ({
  general: s.category({ name: "General", options: { prefix: f.text({ max: 3 }) } }),
  pro: s.category({ name: "Pro", entitlement: "pro", options: { color: f.text() } }),
}))

function make(ent: Entitlements) {
  const adapter = new InProcessAdapter(def, new MemoryStore())
  return new SettingsService(def, adapter, ent)
}

describe("SettingsService", () => {
  it("rejects an unknown setting", async () => {
    const r = await make(AllowAll).set({ guildId: "g", userId: "u" }, "nope", "x", 1)
    expect(r.ok).toBe(false)
  })
  it("rejects an invalid value", async () => {
    const r = await make(AllowAll).set(
      { guildId: "g", userId: "u" },
      "general",
      "prefix",
      "toolong"
    )
    expect(r.ok).toBe(false)
  })
  it("persists a valid value and reads it back", async () => {
    const svc = make(AllowAll)
    const set = await svc.set({ guildId: "g", userId: "u" }, "general", "prefix", "!")
    expect(set.ok).toBe(true)
    const got = await svc.get({ guildId: "g", userId: "u" }, "general", "prefix")
    expect(got).toBe("!")
  })
  it("blocks a gated category without entitlement", async () => {
    const deny: Entitlements = { async has() { return false } }
    const r = await make(deny).set({ guildId: "g", userId: "u" }, "pro", "color", "red")
    expect(r.ok).toBe(false)
    expect(r.error).toContain("entitlement")
  })
})

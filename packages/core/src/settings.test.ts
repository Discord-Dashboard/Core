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

import { describe as d5, it as i5, expect as e5 } from "vitest"
import { SettingsService as SS5 } from "./settings.js"
import { InProcessAdapter as IPA5, MemoryStore as MS5 } from "./inprocess.js"
import { AllowAll as AA5 } from "./entitlements.js"
import { defineSettings as ds5, f as f5 } from "@discord-dashboard/schema"

d5("SettingsService defaults", () => {
  const def5 = ds5((s) => ({
    general: s.category({
      name: "General",
      options: { prefix: f5.text({ max: 3, default: "!" }) },
    }),
  }))
  i5("returns the declared default when unset", async () => {
    const svc = new SS5(def5, new IPA5(def5, new MS5()), AA5)
    expect(await svc.get({ guildId: "g", userId: "u" }, "general", "prefix")).toBe("!")
  })
  i5("returns the stored value once set", async () => {
    const svc = new SS5(def5, new IPA5(def5, new MS5()), AA5)
    await svc.set({ guildId: "g", userId: "u" }, "general", "prefix", "?")
    expect(await svc.get({ guildId: "g", userId: "u" }, "general", "prefix")).toBe("?")
  })
})

import { describe as d8, it as i8, expect as e8 } from "vitest"
import { SettingsService as SS8 } from "./settings.js"
import { InProcessAdapter as IPA8, MemoryStore as MS8 } from "./inprocess.js"
import { AllowAll as AA8 } from "./entitlements.js"
import { defineSettings as ds8, f as f8 } from "@discord-dashboard/schema"

d8("validation error detail", () => {
  const def8 = ds8((s) => ({
    general: s.category({ name: "General", options: { prefix: f8.text({ max: 3 }) } }),
  }))
  i8("returns a descriptive message, not a generic one", async () => {
    const svc = new SS8(def8, new IPA8(def8, new MS8()), AA8)
    const res = await svc.set({ guildId: "g", userId: "u" }, "general", "prefix", "toolong")
    e8(res.ok).toBe(false)
    e8(res.error).toBeTruthy()
    e8(res.error).not.toBe("invalid value")
  })
})

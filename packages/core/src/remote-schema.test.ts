import { describe, it, expect } from "vitest"
import { buildDefFromAdapter } from "./remote-schema.js"
import { SettingsService } from "./settings.js"
import { AllowAll } from "./entitlements.js"
import type { BotAdapter } from "./adapter.js"

// A fake remote bot that only exposes a wire descriptor and a store.
function fakeRemoteBot(): BotAdapter {
  const store = new Map<string, unknown>()
  return {
    async describeSchema() {
      return {
        version: "1.0",
        categories: [
          {
            id: "general",
            name: "General",
            options: [{ id: "prefix", type: "text", label: "Prefix", max: 3 }],
          },
        ],
      }
    },
    async getChannels() {
      return []
    },
    async getRoles() {
      return []
    },
    async getMemberPermissions() {
      return []
    },
    async getSetting(guildId, key) {
      return store.get(`${guildId}:${key}`) ?? null
    },
    async setSetting(guildId, key, value) {
      store.set(`${guildId}:${key}`, value)
      return { ok: true }
    },
    async invokeAction() {
      return null
    },
  }
}

describe("buildDefFromAdapter", () => {
  it("reconstructs a validating schema from a remote bot", async () => {
    const adapter = fakeRemoteBot()
    const def = await buildDefFromAdapter(adapter)
    const service = new SettingsService(def, adapter, AllowAll)

    const good = await service.set({ guildId: "g", userId: "u" }, "general", "prefix", "!")
    expect(good.ok).toBe(true)
    const bad = await service.set({ guildId: "g", userId: "u" }, "general", "prefix", "toolong")
    expect(bad.ok).toBe(false)
  })
})

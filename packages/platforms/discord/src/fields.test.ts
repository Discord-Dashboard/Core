import { describe, it, expect } from "vitest"
import { buildDefFromAdapter, type BotAdapter } from "@asctane-dashboard/core"
import { defineSettings, toWire } from "@asctane-dashboard/schema"
import { discord, f } from "./index.js"

const settings = defineSettings((s) => ({
  general: s.category({
    name: "General",
    options: {
      log: f.channel({ types: ["text"], hideNsfw: true }),
      mods: f.roleMulti({ includeBots: true }),
      welcome: f.embed(),
    },
  }),
}))

describe("discord fields", () => {
  it("turns channel and role pickers into refs with a Discord filter", () => {
    const [log, mods] = toWire(settings).categories[0]!.options
    expect(log).toMatchObject({
      type: "ref",
      kind: "channel",
      filter: { types: ["text"], hideNsfw: true },
    })
    expect(log!.multiple).toBeUndefined()
    expect(mods).toMatchObject({
      type: "ref",
      kind: "role",
      multiple: true,
      filter: { includeBots: true },
    })
  })

  it("leaves the filter off when nothing narrows the picker", () => {
    expect(f.channel().opts.filter).toBeUndefined()
  })

  it("lets the dashboard rebuild an embed from a remote bot's schema", async () => {
    const adapter = { describeSchema: async () => toWire(settings) } as unknown as BotAdapter
    const platform = discord({ clientId: "c", clientSecret: "s", redirectUri: "http://x/cb" })
    const def = await buildDefFromAdapter(adapter, undefined, [platform])
    const welcome = def.categories["general"]!.options["welcome"]!
    expect(welcome.type).toBe("embed")
    expect(welcome.zod.safeParse({ title: "Hi" }).success).toBe(true)
    // Without the platform the embed falls back to a text field.
    const plain = await buildDefFromAdapter(adapter)
    expect(plain.categories["general"]!.options["welcome"]!.type).toBe("text")
  })
})

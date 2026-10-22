import { describe, it, expect } from "vitest"
import { fromV2, fieldFor } from "./index.js"

describe("compat-v2", () => {
  it("maps v2 form types to v3 fields", () => {
    expect(fieldFor("switch").type).toBe("switch")
    expect(fieldFor("channelsSelect").opts).toMatchObject({ kind: "channel" })
    expect(fieldFor("rolesMultiSelect").opts).toMatchObject({ kind: "role", multiple: true })
    expect(fieldFor(undefined).type).toBe("text")
  })
  it("bridges getActualSet and setNew through the adapter", async () => {
    let stored: unknown = null
    const { adapter } = fromV2([
      {
        categoryId: "general",
        categoryName: "General",
        categoryOptionsList: [
          {
            optionId: "prefix",
            optionName: "Prefix",
            optionType: { type: "input" },
            getActualSet: async () => stored,
            setNew: async ({ newData }) => {
              stored = newData
            },
          },
        ],
      },
    ])
    await adapter.setSetting("g", "general.prefix", "!")
    expect(stored).toBe("!")
    expect(await adapter.getSetting("g", "general.prefix")).toBe("!")
  })
  it("passes the acting user id into v2 handlers", async () => {
    let seen: string | undefined
    const { adapter } = fromV2([
      {
        categoryId: "general",
        categoryName: "General",
        categoryOptionsList: [
          {
            optionId: "prefix",
            optionType: { type: "input" },
            setNew: async ({ user }) => {
              seen = user.id
            },
          },
        ],
      },
    ])
    await adapter.setSetting("g", "general.prefix", "!", { userId: "u42" })
    expect(seen).toBe("u42")
  })
})

describe("compat-v2 form types", () => {
  it("turns v2 select lists around: the stored value becomes the key", () => {
    const field = fieldFor({ type: "select", data: { keys: ["Polish", "English"], values: ["pl", "en"] } })
    expect(field.type).toBe("select")
    expect(field.opts.options).toEqual({ pl: "Polish", en: "English" })
    expect(field.zod.safeParse("en").success).toBe(true)
    expect(field.zod.safeParse("English").success).toBe(false)
  })
  it("keeps multiSelect a choice list, not a channel picker", () => {
    const field = fieldFor({ type: "multiSelect", data: { keys: ["A"], values: ["a"] } })
    expect(field.type).toBe("multiSelect")
    expect(field.zod.safeParse(["a"]).success).toBe(true)
  })
  it("maps input limits, colors and embeds", () => {
    const input = fieldFor({ type: "input", min: 1, max: 3 })
    expect(input.zod.safeParse("abcd").success).toBe(false)
    expect(fieldFor({ type: "colorSelect", data: "#ff0000" }).opts).toMatchObject({ default: "#ff0000" })
    expect(fieldFor({ type: "embedBuilder" }).type).toBe("embed")
  })
  it("carries category and option descriptions over", () => {
    const { def } = fromV2([
      {
        categoryId: "setup",
        categoryName: "Setup",
        categoryDescription: "Set up the bot",
        categoryOptionsList: [
          { optionId: "lang", optionName: "Language", optionDescription: "The language" },
        ],
      },
    ])
    expect(def.categories.setup?.description).toBe("Set up the bot")
    expect(def.categories.setup?.options.lang?.opts.description).toBe("The language")
  })
  it("lists channels and roles from a source", async () => {
    const { adapter } = fromV2([], {
      source: {
        resources: async (_space, kind) => [{ label: kind, value: "1" }],
        memberPermissions: async () => ["MANAGE_GUILD"],
      },
    })
    expect(await adapter.getChannels("g")).toEqual([{ label: "channel", value: "1" }])
    expect(await adapter.getRoles("g")).toEqual([{ label: "role", value: "1" }])
    expect(await adapter.getMemberPermissions("g", "u")).toEqual(["MANAGE_GUILD"])
  })
})

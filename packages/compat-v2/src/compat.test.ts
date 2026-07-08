import { describe, it, expect } from "vitest"
import { fromV2, fieldFor } from "./index.js"

describe("compat-v2", () => {
  it("maps v2 form types to v3 fields", () => {
    expect(fieldFor("switch").type).toBe("switch")
    expect(fieldFor("channelsSelect").type).toBe("channel")
    expect(fieldFor("rolesMultiSelect").type).toBe("roleMulti")
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
})

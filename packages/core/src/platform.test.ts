import { describe, it, expect } from "vitest"
import {
  createPlatformRegistry,
  definePlatform,
  parseSpaceKey,
  spaceKey,
  type Platform,
} from "./platform.js"

function fakePlatform(id: string, resources: string[] = ["channel", "role"]): Platform {
  return {
    id,
    name: id,
    resources,
    auth: {
      start: () => ({ kind: "redirect", url: `https://${id}.example/authorize` }),
      finish: async () => ({ user: { id: "u1", username: "user" }, spaces: [] }),
    },
  }
}

describe("space keys", () => {
  it("round trips a space ref", () => {
    const key = spaceKey({ platform: "discord", id: "123" })
    expect(key).toBe("discord:123")
    expect(parseSpaceKey(key)).toEqual({ platform: "discord", id: "123" })
  })
  it("keeps colons inside the space id", () => {
    expect(parseSpaceKey("slack:T1:C2")).toEqual({ platform: "slack", id: "T1:C2" })
  })
  it("rejects a bad platform id or an empty space id", () => {
    expect(() => spaceKey({ platform: "Discord", id: "1" })).toThrow()
    expect(() => spaceKey({ platform: "discord", id: "" })).toThrow()
    expect(() => parseSpaceKey("discord")).toThrow()
    expect(() => parseSpaceKey(":123")).toThrow()
    expect(() => parseSpaceKey("discord:")).toThrow()
  })
})

describe("platforms", () => {
  it("rejects an invalid id and duplicate resource kinds", () => {
    expect(() => definePlatform(fakePlatform("Not Valid"))).toThrow()
    expect(() => definePlatform(fakePlatform("discord", ["role", "role"]))).toThrow()
  })
  it("looks platforms up by id and knows what they support", () => {
    const registry = createPlatformRegistry([
      fakePlatform("discord"),
      fakePlatform("telegram", ["channel"]),
    ])
    expect(registry.list().map((p) => p.id)).toEqual(["discord", "telegram"])
    expect(registry.get("discord")?.name).toBe("discord")
    expect(registry.get("slack")).toBeUndefined()
    expect(registry.supports("telegram", "role")).toBe(false)
    expect(registry.supports("discord", "role")).toBe(true)
    expect(registry.supports("slack", "channel")).toBe(false)
  })
  it("refuses the same platform twice", () => {
    expect(() =>
      createPlatformRegistry([fakePlatform("discord"), fakePlatform("discord")])
    ).toThrow(/twice/)
  })
})

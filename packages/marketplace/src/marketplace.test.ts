import { describe, it, expect } from "vitest"
import { Marketplace } from "./index.js"

describe("marketplace", () => {
  it("publishes and lists by kind", () => {
    const m = new Marketplace()
    m.publish({ id: "a", kind: "module", name: "A", version: "1", author: { id: "u", name: "u" }, priceCents: 0, signature: "x" })
    m.publish({ id: "b", kind: "theme", name: "B", version: "1", author: { id: "u", name: "u" }, priceCents: 100, signature: "y" })
    expect(m.list()).toHaveLength(2)
    expect(m.list("theme").map((l) => l.id)).toEqual(["b"])
    expect(m.get("a")?.name).toBe("A")
  })
})

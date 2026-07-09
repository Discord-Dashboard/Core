import { describe, it, expect } from "vitest"
import { Marketplace } from "./index.js"

const listing = (over: Partial<Parameters<Marketplace["publish"]>[0]> = {}) => ({
  id: "a",
  kind: "module" as const,
  name: "A",
  version: "1",
  author: { id: "u", name: "u" },
  priceCents: 0,
  signature: "x",
  ...over,
})

describe("marketplace", () => {
  it("publishes and lists by kind", () => {
    const m = new Marketplace()
    m.publish(listing())
    m.publish(listing({ id: "b", kind: "theme", name: "B", priceCents: 100, signature: "y" }))
    expect(m.list()).toHaveLength(2)
    expect(m.list("theme").map((l) => l.id)).toEqual(["b"])
    expect(m.get("a")?.name).toBe("A")
  })

  it("lets the same author update their own listing", () => {
    const m = new Marketplace()
    m.publish(listing({ priceCents: 0 }))
    m.publish(listing({ priceCents: 500 }))
    expect(m.get("a")?.priceCents).toBe(500)
  })

  it("refuses to let another author overwrite a listing", () => {
    const m = new Marketplace()
    m.publish(listing({ author: { id: "u", name: "u" } }))
    expect(() =>
      m.publish(listing({ author: { id: "attacker", name: "e" }, priceCents: 0 }))
    ).toThrow(/another author/)
    // The original listing is untouched.
    expect(m.get("a")?.author.id).toBe("u")
  })

  it("rejects a listing whose signature the verifier declines", () => {
    const m = new Marketplace((l) => l.signature === "good")
    expect(() => m.publish(listing({ signature: "bad" }))).toThrow(/signature/)
    expect(() => m.publish(listing({ signature: "good" }))).not.toThrow()
  })
})

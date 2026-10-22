import { describe, it, expect } from "vitest"
import { createPkce, createState } from "./oauth.js"

describe("oauth helpers", () => {
  it("creates a pkce pair where challenge differs from verifier", () => {
    const { verifier, challenge } = createPkce()
    expect(verifier.length).toBeGreaterThan(20)
    expect(challenge.length).toBeGreaterThan(20)
    expect(challenge).not.toBe(verifier)
  })
  it("creates a fresh state every time", () => {
    expect(createState()).not.toBe(createState())
  })
})

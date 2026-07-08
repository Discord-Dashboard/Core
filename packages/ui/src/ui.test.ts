import { describe, it, expect } from "vitest"
import { tokens } from "./tokens.js"

describe("ui tokens", () => {
  it("exposes themeable color and radius tokens", () => {
    expect(tokens.color.primary).toContain("var(")
    expect(tokens.radius).toContain("var(")
    expect(tokens.color.bg).toContain("var(")
  })
})

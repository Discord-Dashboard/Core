import { describe, it, expect } from "vitest"
import { tokens } from "./tokens.js"

describe("ui tokens", () => {
  it("exposes themeable color and radius tokens", () => {
    expect(tokens.color.primary).toContain("var(")
    expect(tokens.radius.base).toContain("var(")
    expect(tokens.color.bg).toContain("var(")
    expect(tokens.gradient.brand).toContain("var(")
    expect(tokens.shadow.base).toContain("var(")
  })
})

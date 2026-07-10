import { describe, it, expect } from "vitest"
import { isSafeTheme, themeToCss } from "@discord-dashboard/ui"
import { defaultTheme } from "./index.js"

describe("default theme", () => {
  it("is a valid, safe theme module", () => {
    expect(defaultTheme.id).toBe("default")
    expect(defaultTheme.name).toBe("Default")
    expect(isSafeTheme(defaultTheme.tokens)).toBe(true)
  })
  it("renders to css custom properties", () => {
    const css = themeToCss(defaultTheme.tokens)
    expect(css).toContain("--dd-color-primary: #5865f2;")
    expect(css).toContain("--dd-radius: 10px;")
  })
})

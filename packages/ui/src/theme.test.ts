import { describe, it, expect } from "vitest"
import { themeToCss, themes } from "./theme.js"

describe("theming", () => {
  it("turns a token map into css custom properties", () => {
    const css = themeToCss({ "color-primary": "#fff", "radius": "8px" })
    expect(css).toContain("--dd-color-primary: #fff;")
    expect(css).toContain("--dd-radius: 8px;")
    expect(css.startsWith(":root {")).toBe(true)
  })
  it("ships named presets", () => {
    expect(themes.midnight!["color-primary"]).toBe("#5865f2")
    expect(Object.keys(themes)).toContain("aurora")
  })
})

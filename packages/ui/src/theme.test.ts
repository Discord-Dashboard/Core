import { describe, it, expect } from "vitest"
import { themeToCss, themes, isSafeTheme } from "./theme.js"

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
  it("drops values that try to break out of the css block", () => {
    const css = themeToCss({
      "color-primary": "#fff",
      evil: "red } body { display: none } .x{color:red",
      "bad-url": "url(javascript:alert(1))",
    })
    expect(css).toContain("--dd-color-primary: #fff;")
    expect(css).not.toContain("display: none")
    expect(css).not.toContain("javascript:")
  })
  it("validates a theme for the marketplace", () => {
    expect(isSafeTheme({ "color-primary": "#5865f2", radius: "8px" })).toBe(true)
    expect(isSafeTheme({ evil: "red}</style>" })).toBe(false)
    expect(isSafeTheme({ "bad key": "#fff" })).toBe(false)
  })
})

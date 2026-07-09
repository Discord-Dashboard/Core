import { describe, it, expect } from "vitest"
import { pageSchema, pageSchemaFor } from "./schema.js"
import { isSafeUrl, safeUrl } from "./url.js"
import { generatePage } from "./ai.js"

describe("url safety", () => {
  it("rejects dangerous url schemes", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false)
    expect(isSafeUrl("JavaScript:alert(1)")).toBe(false)
    expect(isSafeUrl("data:text/html,<script>")).toBe(false)
    expect(isSafeUrl("vbscript:msgbox")).toBe(false)
    // A control character must not smuggle a scheme past the check.
    expect(isSafeUrl("java\tscript:alert(1)")).toBe(false)
    // Protocol-relative and backslash urls point off-origin, not "relative".
    expect(isSafeUrl("//evil.com")).toBe(false)
    expect(isSafeUrl("/\\evil.com")).toBe(false)
    expect(isSafeUrl("\\\\evil.com")).toBe(false)
  })
  it("allows http, https, mailto and relative urls", () => {
    expect(isSafeUrl("https://example.com")).toBe(true)
    expect(isSafeUrl("http://example.com")).toBe(true)
    expect(isSafeUrl("/local/path")).toBe(true)
    expect(isSafeUrl("#anchor")).toBe(true)
    expect(isSafeUrl("mailto:a@b.com")).toBe(true)
  })
  it("neutralizes unsafe urls at render", () => {
    expect(safeUrl("javascript:alert(1)")).toBe("#")
    expect(safeUrl("https://example.com")).toBe("https://example.com")
    expect(safeUrl(42)).toBe("#")
  })
  it("rejects a page whose button href is a javascript url", () => {
    const r = pageSchema.safeParse({
      version: 1,
      root: { title: "t" },
      content: [{ type: "Button", props: { label: "x", href: "javascript:alert(1)" } }],
    })
    expect(r.success).toBe(false)
  })
  it("accepts a page with a safe href", () => {
    const r = pageSchema.safeParse({
      version: 1,
      root: { title: "t" },
      content: [{ type: "Button", props: { label: "x", href: "https://example.com" } }],
    })
    expect(r.success).toBe(true)
  })
  it("accepts the divider, spacer and list components", () => {
    const r = pageSchema.safeParse({
      version: 1,
      root: { title: "t" },
      content: [
        { type: "Divider", props: {} },
        { type: "Spacer", props: { height: 24 } },
        { type: "List", props: { items: [{ text: "a" }, { text: "b" }] } },
      ],
    })
    expect(r.success).toBe(true)
  })
})

describe("catalog enforcement", () => {
  it("rejects a component outside the catalog even if globally whitelisted", () => {
    const schema = pageSchemaFor(["Heading"])
    const r = schema.safeParse({
      version: 1,
      root: { title: "t" },
      content: [{ type: "Button", props: {} }],
    })
    expect(r.success).toBe(false)
  })
  it("rejects an out of catalog page returned by the model", async () => {
    const llm = {
      async complete() {
        return JSON.stringify({
          version: 1,
          root: { title: "t" },
          content: [{ type: "SettingsPanel", props: {} }],
        })
      },
    }
    const res = await generatePage(llm, "x", ["Heading"], 2)
    expect(res.ok).toBe(false)
  })
})

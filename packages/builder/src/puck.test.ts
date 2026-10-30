import { describe, it, expect } from "vitest"
import { COMPONENT_TYPES, pageSchema } from "./schema.js"
import { puckConfig, toPuckData, fromPuckData } from "./puck.js"

describe("builder component consistency", () => {
  it("defines a render for every whitelisted component", () => {
    const defined = Object.keys(puckConfig.components)
    for (const type of COMPONENT_TYPES) {
      expect(defined).toContain(type)
    }
  })
})

describe("editor data conversion", () => {
  const page = pageSchema.parse({
    version: 1,
    root: { title: "Home" },
    content: [
      { type: "Heading", props: { text: "Welcome" } },
      { type: "Button", props: { label: "Docs", href: "https://example.com" } },
    ],
  })

  it("round trips a page through the editor format", () => {
    const data = toPuckData(page)
    expect(data.root.props).toEqual({ title: "Home" })
    expect(data.content.map((b) => b.props.id)).toEqual(["Heading-0", "Button-1"])
    expect(fromPuckData(data)).toEqual(page)
  })

  it("drops editor ids and falls back to a title", () => {
    const back = fromPuckData(
      { root: { props: {} }, content: [{ type: "Text", props: { id: "x", text: "Hi" } }] },
      "about"
    )
    expect(back).toEqual({
      version: 1,
      root: { title: "about" },
      content: [{ type: "Text", props: { text: "Hi" } }],
    })
    expect(pageSchema.safeParse(back).success).toBe(true)
  })
})

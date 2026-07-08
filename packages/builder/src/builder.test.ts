import { describe, it, expect } from "vitest"
import { generatePage } from "./ai.js"
import { MockLlm } from "./providers.js"
import { pageSchema } from "./schema.js"

describe("builder", () => {
  it("generates a valid page with the mock client", async () => {
    const res = await generatePage(MockLlm, "make a hello page", ["Heading"])
    expect(res.ok).toBe(true)
    expect(res.page?.content[0]?.type).toBe("Heading")
  })
  it("fails after retries when the model returns junk", async () => {
    const bad = { async complete() { return "not json" } }
    const res = await generatePage(bad, "x", ["Heading"], 2)
    expect(res.ok).toBe(false)
  })
  it("rejects a page with an unknown component", () => {
    const r = pageSchema.safeParse({
      version: 1,
      root: { title: "t" },
      content: [{ type: "Evil", props: {} }],
    })
    expect(r.success).toBe(false)
  })
})

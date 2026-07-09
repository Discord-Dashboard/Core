import { describe, it, expect, vi } from "vitest"
import { httpLlm } from "./providers.js"
import { generatePage } from "./ai.js"

describe("httpLlm provider", () => {
  it("posts the prompt and returns the output text", async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ output: "hello" }), { status: 200 })
    )
    vi.stubGlobal("fetch", fetchMock)
    const llm = httpLlm({ endpoint: "http://x/complete", apiKey: "k", model: "m" })
    const out = await llm.complete("do it", ["Heading"])
    expect(out).toBe("hello")
    expect(fetchMock).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it("drives generatePage to a valid page", async () => {
    const page = JSON.stringify({
      version: 1,
      root: { title: "Landing" },
      content: [{ type: "Hero", props: { title: "Hi" } }],
    })
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ output: page }), { status: 200 }))
    )
    const llm = httpLlm({ endpoint: "http://x", apiKey: "k", model: "m" })
    const res = await generatePage(llm, "make a landing", ["Hero"])
    expect(res.ok).toBe(true)
    expect(res.page?.root.title).toBe("Landing")
    vi.unstubAllGlobals()
  })
})

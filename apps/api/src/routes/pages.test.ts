import { describe, it, expect, beforeEach } from "vitest"
import type { FastifyInstance } from "fastify"
import { buildServer } from "../server.js"
import type { ApiConfig } from "../config.js"
import { SessionStore, SESSION_COOKIE } from "../auth/session.js"
import { InProcessAdapter, MemoryStore } from "@discord-dashboard/core"
import { defineSettings } from "@discord-dashboard/schema"

const config: ApiConfig = {
  port: 0,
  cookieSecret: "test-secret-at-least-32-chars-long-000",
  allowedOrigins: ["http://localhost:3000"],
  discord: { clientId: "c", clientSecret: "s", redirectUri: "http://x/cb" },
}
const def = defineSettings(() => ({}))

const origin = { origin: "http://localhost:3000" }
const validPage = {
  version: 1,
  root: { title: "Home" },
  content: [
    { type: "Heading", props: { text: "Welcome" } },
    { type: "Button", props: { label: "Docs", href: "https://example.com" } },
  ],
}

async function make(canEdit: boolean, llm?: { complete: () => Promise<string> }) {
  const sessions = new SessionStore()
  const sid = sessions.create()
  sessions.set(sid, { userId: "u1" })
  const cookie = `${SESSION_COOKIE}=${sid}`
  const app = await buildServer(config, {
    def,
    adapter: new InProcessAdapter(def, new MemoryStore()),
    sessions,
    canEditPages: canEdit ? () => true : undefined,
    llm,
  })
  return { app, cookie }
}

describe("page routes", () => {
  let app: FastifyInstance
  let cookie: string
  beforeEach(async () => {
    const made = await make(true)
    app = made.app
    cookie = made.cookie
  })

  it("requires authentication to edit", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/pages/home",
      headers: origin,
      payload: { content: validPage },
    })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it("forbids editing when the user is not an allowed editor", async () => {
    await app.close()
    const made = await make(false)
    const res = await made.app.inject({
      method: "POST",
      url: "/api/pages/home",
      headers: { ...origin, cookie: made.cookie },
      payload: { content: validPage },
    })
    expect(res.statusCode).toBe(403)
    await made.app.close()
  })

  it("saves, publishes, then serves a page publicly", async () => {
    const draft = await app.inject({
      method: "POST",
      url: "/api/pages/home",
      headers: { ...origin, cookie },
      payload: { content: validPage },
    })
    expect(draft.statusCode).toBe(200)
    expect((draft.json() as { status: string }).status).toBe("draft")

    // A draft is not visible publicly.
    const hidden = await app.inject({ method: "GET", url: "/api/pages/home" })
    expect(hidden.statusCode).toBe(404)

    const published = await app.inject({
      method: "POST",
      url: "/api/pages/home",
      headers: { ...origin, cookie },
      payload: { content: validPage, status: "published" },
    })
    expect((published.json() as { version: number }).version).toBe(2)

    const got = await app.inject({ method: "GET", url: "/api/pages/home" })
    expect(got.statusCode).toBe(200)
    expect((got.json() as { content: { root: { title: string } } }).content.root.title).toBe(
      "Home"
    )

    const list = await app.inject({ method: "GET", url: "/api/pages" })
    expect((list.json() as { pages: { slug: string }[] }).pages.map((p) => p.slug)).toEqual([
      "home",
    ])
    await app.close()
  })

  it("keeps version history and restores an earlier version", async () => {
    const one = { version: 1, root: { title: "one" }, content: [] }
    const two = { version: 1, root: { title: "two" }, content: [] }
    const save = (content: unknown) =>
      app.inject({
        method: "POST",
        url: "/api/pages/hist",
        headers: { ...origin, cookie },
        payload: { content, status: "published" },
      })
    await save(one)
    await save(two)

    const hist = await app.inject({
      method: "GET",
      url: "/api/pages/hist/history",
      headers: { cookie },
    })
    expect(
      (hist.json() as { versions: { version: number }[] }).versions.map((v) => v.version)
    ).toEqual([2, 1])

    // Restore version 1: it comes back as a new version 3.
    const restored = await app.inject({
      method: "POST",
      url: "/api/pages/hist/restore",
      headers: { ...origin, cookie },
      payload: { version: 1 },
    })
    expect((restored.json() as { version: number }).version).toBe(3)

    const got = await app.inject({ method: "GET", url: "/api/pages/hist" })
    expect(
      (got.json() as { content: { root: { title: string } } }).content.root.title
    ).toBe("one")

    // Restoring a version that does not exist is a 404.
    const missing = await app.inject({
      method: "POST",
      url: "/api/pages/hist/restore",
      headers: { ...origin, cookie },
      payload: { version: 99 },
    })
    expect(missing.statusCode).toBe(404)
    await app.close()
  })

  it("lets an editor read a draft the public cannot see", async () => {
    await app.inject({
      method: "POST",
      url: "/api/pages/wip",
      headers: { ...origin, cookie },
      payload: { content: validPage },
    })
    // Public sees nothing (it is a draft).
    const pub = await app.inject({ method: "GET", url: "/api/pages/wip" })
    expect(pub.statusCode).toBe(404)
    // The editor can read it.
    const draft = await app.inject({
      method: "GET",
      url: "/api/pages/wip/draft",
      headers: { cookie },
    })
    expect(draft.statusCode).toBe(200)
    expect((draft.json() as { status: string }).status).toBe("draft")
    // Without editor rights it is refused.
    const anon = await app.inject({ method: "GET", url: "/api/pages/wip/draft" })
    expect(anon.statusCode).toBe(401)
    await app.close()
  })

  it("rejects a page with an unsafe url", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/pages/home",
      headers: { ...origin, cookie },
      payload: {
        content: {
          version: 1,
          root: { title: "x" },
          content: [{ type: "Button", props: { label: "x", href: "javascript:alert(1)" } }],
        },
      },
    })
    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it("rejects a page with an unknown component", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/pages/home",
      headers: { ...origin, cookie },
      payload: {
        content: { version: 1, root: { title: "x" }, content: [{ type: "Evil", props: {} }] },
      },
    })
    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it("reports 501 when ai generation is not configured", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/pages/home/generate",
      headers: { ...origin, cookie },
      payload: { intent: "a landing page" },
    })
    expect(res.statusCode).toBe(501)
    await app.close()
  })

  it("generates and stores a validated page as a draft", async () => {
    await app.close()
    const good = {
      async complete() {
        return JSON.stringify(validPage)
      },
    }
    const made = await make(true, good)
    const res = await made.app.inject({
      method: "POST",
      url: "/api/pages/ai/generate",
      headers: { ...origin, cookie: made.cookie },
      payload: { intent: "a welcome page" },
    })
    expect(res.statusCode).toBe(200)
    expect((res.json() as { status: string }).status).toBe("draft")
    // Not visible publicly until a human publishes it.
    const hidden = await made.app.inject({ method: "GET", url: "/api/pages/ai" })
    expect(hidden.statusCode).toBe(404)
    await made.app.close()
  })

  it("rejects generated output that fails validation", async () => {
    await app.close()
    const evil = {
      async complete() {
        return JSON.stringify({
          version: 1,
          root: { title: "x" },
          content: [{ type: "Button", props: { href: "javascript:alert(1)" } }],
        })
      },
    }
    const made = await make(true, evil)
    const res = await made.app.inject({
      method: "POST",
      url: "/api/pages/ai/generate",
      headers: { ...origin, cookie: made.cookie },
      payload: { intent: "hack" },
    })
    expect(res.statusCode).toBe(422)
    await made.app.close()
  })

  it("rate limits the expensive generate endpoint", async () => {
    await app.close()
    const good = {
      async complete() {
        return JSON.stringify(validPage)
      },
    }
    const made = await make(true, good)
    let limited = false
    for (let i = 0; i < 22 && !limited; i++) {
      const res = await made.app.inject({
        method: "POST",
        url: "/api/pages/rl/generate",
        headers: { ...origin, cookie: made.cookie },
        payload: { intent: "x" },
      })
      if (res.statusCode === 429) limited = true
    }
    expect(limited).toBe(true)
    await made.app.close()
  })

  it("deletes a page", async () => {
    await app.inject({
      method: "POST",
      url: "/api/pages/gone",
      headers: { ...origin, cookie },
      payload: { content: validPage, status: "published" },
    })
    const del = await app.inject({
      method: "DELETE",
      url: "/api/pages/gone",
      headers: { ...origin, cookie },
    })
    expect(del.statusCode).toBe(200)
    const got = await app.inject({ method: "GET", url: "/api/pages/gone" })
    expect(got.statusCode).toBe(404)
    await app.close()
  })
})

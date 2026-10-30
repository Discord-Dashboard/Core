import { describe, it, expect, beforeAll, afterAll } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import type { FastifyInstance } from "fastify"
import { buildServer } from "./server.js"
import type { ApiConfig } from "./config.js"
import { InProcessAdapter, MemoryStore } from "../base.js"
import { defineSettings, f } from "@acstane/schema"

const config: ApiConfig = {
  port: 0,
  cookieSecret: "test-secret-at-least-32-chars-long-000",
  allowedOrigins: ["http://localhost:3000"],
  platforms: [],
}
const def = defineSettings((s) => ({
  general: s.category({ name: "General", options: { prefix: f.text({ max: 3 }) } }),
}))

describe("serving the web app", () => {
  let app: FastifyInstance
  let root: string
  beforeAll(async () => {
    // A tiny stand in for the static export of apps/web.
    root = fs.mkdtempSync(path.join(os.tmpdir(), "dd-web-"))
    fs.writeFileSync(path.join(root, "index.html"), "<p>home</p>")
    fs.mkdirSync(path.join(root, "manage"))
    fs.writeFileSync(path.join(root, "manage", "index.html"), "<p>manage</p>")
    fs.writeFileSync(path.join(root, "manage", "__next.manage.txt"), "prefetch")
    fs.writeFileSync(path.join(root, "login.html"), "<p>login</p>")
    fs.writeFileSync(path.join(root, "404.html"), "<p>missing</p>")
    fs.mkdirSync(path.join(root, "_next", "static"), { recursive: true })
    fs.writeFileSync(path.join(root, "_next", "static", "app.js"), "1")
    app = await buildServer(config, {
      def,
      adapter: new InProcessAdapter(def, new MemoryStore()),
      web: { root },
    })
  })
  afterAll(async () => {
    await app.close()
    fs.rmSync(root, { recursive: true, force: true })
  })

  it("serves the home page and each route's folder, with or without a slash", async () => {
    const home = await app.inject({ method: "GET", url: "/" })
    expect(home.statusCode).toBe(200)
    expect(home.body).toContain("home")
    for (const url of ["/manage", "/manage/", "/manage/?x=1"]) {
      const res = await app.inject({ method: "GET", url })
      expect(res.statusCode).toBe(200)
      expect(res.body).toContain("manage")
    }
  })

  it("serves a flat export's page without its .html extension", async () => {
    const res = await app.inject({ method: "GET", url: "/login" })
    expect(res.statusCode).toBe(200)
    expect(res.body).toContain("login")
  })

  it("keeps the api next to the pages", async () => {
    const res = await app.inject({ method: "GET", url: "/api/schema" })
    expect(res.statusCode).toBe(200)
    expect(res.json().categories[0].id).toBe("general")
  })

  it("answers an unknown page with the 404 page and an unknown api route with json", async () => {
    const page = await app.inject({ method: "GET", url: "/nope" })
    expect(page.statusCode).toBe(404)
    expect(page.body).toContain("missing")
    const api = await app.inject({ method: "GET", url: "/api/nope" })
    expect(api.statusCode).toBe(404)
    expect(api.json()).toEqual({ error: "not found" })
  })

  it("caches hashed assets for good", async () => {
    const res = await app.inject({ method: "GET", url: "/_next/static/app.js" })
    expect(res.headers["cache-control"]).toContain("immutable")
  })

  it("lets the exported pages run their inline scripts and load avatars", async () => {
    const res = await app.inject({ method: "GET", url: "/" })
    const csp = String(res.headers["content-security-policy"])
    expect(csp).toContain("script-src 'self' 'unsafe-inline'")
    expect(csp).toContain("img-src 'self' data: https:")
  })

  it("accepts a state changing request from its own origin", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/spaces/discord/g/settings/general/prefix",
      headers: { origin: "http://dash.example.com", host: "dash.example.com" },
      payload: { value: "!" },
    })
    // Past the origin check, stopped by auth.
    expect(res.statusCode).toBe(401)
  })

  it("still rejects another origin", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/spaces/discord/g/settings/general/prefix",
      headers: { origin: "https://evil.example", host: "dash.example.com" },
      payload: { value: "!" },
    })
    expect(res.statusCode).toBe(403)
  })

  it("leaves the file route out of the OpenAPI document", async () => {
    const res = await app.inject({ method: "GET", url: "/api/openapi.json" })
    expect(Object.keys(res.json().paths)).not.toContain("/*")
  })
})

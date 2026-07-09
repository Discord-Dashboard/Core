import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { pageSchema, COMPONENT_TYPES } from "@discord-dashboard/builder/schema"
import { generatePage, type LlmClient } from "@discord-dashboard/builder/ai"
import {
  SESSION_COOKIE,
  type SessionData,
  type SessionStore,
} from "../auth/session.js"
import type { PageStatus, PageStore } from "../pages/store.js"

export interface PageDeps {
  pages: PageStore
  sessions: SessionStore
  // Authorizes editing pages. Defaults to deny, so pages cannot be changed
  // unless a deployment explicitly says who may edit them.
  canEditPages?: (session: SessionData) => boolean | Promise<boolean>
  // Optional AI provider for page generation. When absent the generate
  // endpoint reports that the feature is not configured.
  llm?: LlmClient
}

export async function registerPageRoutes(app: FastifyInstance, deps: PageDeps) {
  async function requireEditor(
    req: FastifyRequest,
    reply: FastifyReply
  ): Promise<boolean> {
    const session = deps.sessions.get(req.cookies[SESSION_COOKIE])
    if (!session?.userId) {
      reply.code(401).send({ error: "unauthorized" })
      return false
    }
    const allowed = deps.canEditPages ? await deps.canEditPages(session) : false
    if (!allowed) {
      reply.code(403).send({ error: "cannot edit pages" })
      return false
    }
    return true
  }

  // Public: the slugs of published pages.
  app.get("/api/pages", async () => {
    return {
      pages: deps.pages
        .list()
        .filter((p) => p.status === "published")
        .map((p) => ({ slug: p.slug, version: p.version })),
    }
  })

  // Public: a published page, for rendering the landing or a custom page.
  app.get("/api/pages/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const page = deps.pages.get(slug)
    if (!page || page.status !== "published") {
      return reply.code(404).send({ error: "not found" })
    }
    return { slug: page.slug, version: page.version, content: page.content }
  })

  // Editor: create or update a page. The content is validated against the page
  // schema, so a stored page can never carry an unknown component or an unsafe
  // url no matter what the client or an AI generator sends.
  app.post("/api/pages/:slug", async (req, reply) => {
    if (!(await requireEditor(req, reply))) return
    const { slug } = req.params as { slug: string }
    const body = (req.body ?? {}) as { content?: unknown; status?: PageStatus }
    const parsed = pageSchema.safeParse(body.content)
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: parsed.error.issues[0]?.message ?? "invalid page" })
    }
    const status: PageStatus =
      body.status === "published" ? "published" : "draft"
    const page = deps.pages.put(slug, parsed.data, status)
    return { slug: page.slug, version: page.version, status: page.status }
  })

  // Editor: generate a page from a prompt. The model output is validated the
  // same way a hand edited page is, and the result is saved as a draft so a
  // human reviews it before it goes live. Never runs raw model markup. A tight
  // rate limit protects the paid LLM call from a runaway client.
  app.post("/api/pages/:slug/generate", {
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    if (!(await requireEditor(req, reply))) return
    if (!deps.llm) {
      return reply.code(501).send({ error: "ai generation is not configured" })
    }
    const { slug } = req.params as { slug: string }
    const body = (req.body ?? {}) as { intent?: string; catalog?: string[] }
    if (!body.intent) {
      return reply.code(400).send({ error: "intent is required" })
    }
    const catalog =
      Array.isArray(body.catalog) && body.catalog.length > 0
        ? body.catalog
        : [...COMPONENT_TYPES]
    const result = await generatePage(deps.llm, body.intent, catalog)
    if (!result.ok || !result.page) {
      return reply.code(422).send({ error: result.error ?? "generation failed" })
    }
    const page = deps.pages.put(slug, result.page, "draft")
    return {
      slug: page.slug,
      version: page.version,
      status: page.status,
      content: page.content,
    }
  })

  // Editor: the version history of a page, newest first.
  app.get("/api/pages/:slug/history", async (req, reply) => {
    if (!(await requireEditor(req, reply))) return
    const { slug } = req.params as { slug: string }
    return {
      versions: deps.pages
        .history(slug)
        .map((p) => ({ version: p.version, status: p.status })),
    }
  })

  // Editor: restore an earlier version as a new current version. Lets an editor
  // undo a bad edit or a generated draft.
  app.post("/api/pages/:slug/restore", async (req, reply) => {
    if (!(await requireEditor(req, reply))) return
    const { slug } = req.params as { slug: string }
    const { version } = (req.body ?? {}) as { version?: number }
    if (typeof version !== "number") {
      return reply.code(400).send({ error: "version is required" })
    }
    const page = deps.pages.restore(slug, version)
    if (!page) return reply.code(404).send({ error: "no such version" })
    return { slug: page.slug, version: page.version, status: page.status }
  })

  // Editor: delete a page.
  app.delete("/api/pages/:slug", async (req, reply) => {
    if (!(await requireEditor(req, reply))) return
    const { slug } = req.params as { slug: string }
    if (!deps.pages.remove(slug)) {
      return reply.code(404).send({ error: "not found" })
    }
    return { ok: true }
  })
}

"use client"

import { useEffect, useState } from "react"
import { IconExternal, IconLayout, IconWand } from "../components/icons"

const API = process.env.NEXT_PUBLIC_API ?? ""

interface PageSummary {
  slug: string
  version: number
  // Set on the editor's list, which includes drafts.
  status?: "draft" | "published"
  live?: boolean
}

interface Access {
  canEdit: boolean
  ai: boolean
}

// Turns a page name into a slug for its url: lowercase letters, digits and dashes.
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
}

// Lists builder pages. Editors see drafts too, can open the editor and start a
// new page. Pages are validated data, never code, so they render safely.
export default function BuilderPage() {
  const [pages, setPages] = useState<PageSummary[] | null>(null)
  const [access, setAccess] = useState<Access>({ canEdit: false, ai: false })
  const [name, setName] = useState("")

  useEffect(() => {
    const opts = { credentials: "include" as const }
    fetch(`${API}/api/builder/access`, opts)
      .then((r) => (r.ok ? r.json() : { canEdit: false, ai: false }))
      .catch(() => ({ canEdit: false, ai: false }))
      .then((a: Access) => {
        setAccess(a)
        return fetch(`${API}/api/${a.canEdit ? "builder/pages" : "pages"}`, opts)
      })
      .then((r) => (r.ok ? r.json() : { pages: [] }))
      .then((data) => setPages(data.pages ?? []))
      .catch(() => setPages([]))
  }, [])

  const slug = toSlug(name)

  return (
    <main className="dd-stack">
      <div className="dd-page-head">
        <div>
          <h1 className="dd-page-title">Page builder</h1>
          <p className="dd-page-sub">
            Drag and drop your pages{access.ai ? ", or generate one from a prompt" : ""}.
            Pages are validated data, never code.
          </p>
        </div>
        {access.ai && (
          <span className="dd-chip dd-chip--brand">
            <IconWand size={13} />
            AI assisted
          </span>
        )}
      </div>

      {access.canEdit && (
        <form
          className="dd-newpage"
          onSubmit={(e) => {
            e.preventDefault()
            if (slug) window.location.href = `/builder/edit?slug=${encodeURIComponent(slug)}`
          }}
        >
          <label className="dd-visually-hidden" htmlFor="dd-newpage-name">
            New page name
          </label>
          <input
            id="dd-newpage-name"
            placeholder="New page name, for example rules"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="dd-btn dd-btn--primary dd-btn--sm" disabled={!slug}>
            New page
          </button>
        </form>
      )}

      <section aria-label="Published pages" className="dd-stack">
        {!pages ? (
          <div className="dd-grid" aria-busy="true" aria-label="Loading pages">
            <div className="dd-skeleton" style={{ minHeight: 150 }} />
            <div className="dd-skeleton" style={{ minHeight: 150 }} />
            <div className="dd-skeleton" style={{ minHeight: 150 }} />
          </div>
        ) : pages.length === 0 ? (
          <div className="dd-empty">
            <span className="dd-empty__icon" aria-hidden>
              <IconLayout size={20} />
            </span>
            <h2>{access.canEdit ? "No pages yet" : "No published pages yet"}</h2>
            <p>
              {access.canEdit
                ? "Give your first page a name above to open the editor."
                : "Pages published from the builder show up here."}
            </p>
          </div>
        ) : (
          <div className="dd-grid">
            {pages.map((p) => (
              <a
                className="dd-pagecard"
                href={
                  access.canEdit
                    ? `/builder/edit?slug=${encodeURIComponent(p.slug)}`
                    : `/p?slug=${encodeURIComponent(p.slug)}`
                }
                key={p.slug}
              >
                <span className="dd-pagecard__preview" aria-hidden>
                  <span className="dd-pagecard__lines">
                    <span />
                    <span />
                    <span />
                  </span>
                </span>
                <span className="dd-pagecard__body">
                  <span className="dd-pagecard__slug">/{p.slug}</span>
                  <span
                    style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                  >
                    <span className="dd-chip">v{p.version}</span>
                    {p.status === "draft" && (
                      <span className="dd-chip">{p.live ? "Unpublished changes" : "Draft"}</span>
                    )}
                    {!access.canEdit && <IconExternal size={14} className="dd-muted" />}
                  </span>
                </span>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

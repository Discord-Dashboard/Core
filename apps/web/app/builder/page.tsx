"use client"

import { useEffect, useState } from "react"
import { IconExternal, IconLayout, IconWand } from "../components/icons"

const API = process.env.NEXT_PUBLIC_API ?? "http://localhost:3001"

interface PageSummary {
  slug: string
  version: number
}

// Lists the published builder pages and links to each public view. Pages are
// validated data, never code, so they can be rendered safely.
export default function BuilderPage() {
  const [pages, setPages] = useState<PageSummary[] | null>(null)

  useEffect(() => {
    fetch(`${API}/api/pages`)
      .then((r) => (r.ok ? r.json() : { pages: [] }))
      .then((data) => setPages(data.pages ?? []))
      .catch(() => setPages([]))
  }, [])

  return (
    <main className="dd-stack">
      <div className="dd-page-head">
        <div>
          <h1 className="dd-page-title">Page builder</h1>
          <p className="dd-page-sub">
            Drag and drop your pages, or generate one from a prompt. Generated
            pages are validated data, never code.
          </p>
        </div>
        <span className="dd-chip dd-chip--brand">
          <IconWand size={13} />
          AI assisted
        </span>
      </div>

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
            <h2>No published pages yet</h2>
            <p>Pages you publish from the builder will show up here.</p>
          </div>
        ) : (
          <div className="dd-grid">
            {pages.map((p) => (
              <a className="dd-pagecard" href={`/p/${p.slug}`} key={p.slug}>
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
                    <IconExternal size={14} className="dd-muted" />
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

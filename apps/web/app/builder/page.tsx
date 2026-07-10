"use client"

import { useEffect, useState } from "react"

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
    <main className="dd-container dd-stack">
      <div>
        <h1 className="dd-page-title">Page builder</h1>
        <p className="dd-page-sub">
          Drag and drop your pages, or generate one from a prompt. Generated
          pages are validated data, never code.
        </p>
      </div>
      <div className="dd-card">
        <div className="dd-card__head">
          <span className="dd-dot" aria-hidden />
          <h2>Published pages</h2>
        </div>
        {!pages ? (
          <p className="dd-muted">Loading...</p>
        ) : pages.length === 0 ? (
          <p className="dd-muted">No published pages yet.</p>
        ) : (
          <ul className="dd-list">
            {pages.map((p) => (
              <li key={p.slug}>
                <a href={`/p/${p.slug}`} style={{ color: "inherit" }}>
                  <div className="dd-row">
                    <div className="dd-row__meta">
                      <span className="dd-row__avatar" aria-hidden>
                        /
                      </span>
                      <strong>{p.slug}</strong>
                    </div>
                    <span className="dd-chip">v{p.version}</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}

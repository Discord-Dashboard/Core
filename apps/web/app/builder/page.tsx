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
    <main style={{ padding: 48 }}>
      <h1>Page builder</h1>
      <p>
        Drag and drop your landing page, or generate one from a prompt. Generated
        pages are validated data, never code.
      </p>
      <h2>Published pages</h2>
      {!pages ? (
        <p>Loading...</p>
      ) : pages.length === 0 ? (
        <p>No published pages yet.</p>
      ) : (
        <ul>
          {pages.map((p) => (
            <li key={p.slug}>
              <a href={`/p/${p.slug}`}>{p.slug}</a> (v{p.version})
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

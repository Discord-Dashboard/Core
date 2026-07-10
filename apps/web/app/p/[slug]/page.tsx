"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { safeUrl } from "@discord-dashboard/builder/url"
import { IconArrowRight, IconCheck, IconDoc } from "../../components/icons"

const API = process.env.NEXT_PUBLIC_API ?? "http://localhost:3001"

interface Block {
  type: string
  props: Record<string, unknown>
}
interface Page {
  root: { title: string }
  content: Block[]
}

const str = (v: unknown) => (typeof v === "string" ? v : "")

// Renders a single whitelisted block. The content is already validated on the
// server (known components, safe urls), and urls are passed through safeUrl
// again here as defense in depth.
function renderBlock(block: Block, i: number) {
  const p = block.props
  switch (block.type) {
    case "Hero":
      return (
        <section className="dd-pubhero" key={i}>
          <h1>{str(p.title)}</h1>
          <p>{str(p.subtitle)}</p>
        </section>
      )
    case "Heading":
      return (
        <h2 className="dd-pubheading" key={i}>
          {str(p.text)}
        </h2>
      )
    case "Text":
      return <p key={i}>{str(p.text)}</p>
    case "Button":
      return (
        <a
          className="dd-btn dd-btn--primary"
          key={i}
          href={safeUrl(p.href)}
          style={{ alignSelf: "start" }}
        >
          {str(p.label)}
          <IconArrowRight size={16} />
        </a>
      )
    case "Card":
      return (
        <div className="dd-card" key={i}>
          <strong>{str(p.title)}</strong>
          <p style={{ marginTop: 6 }}>{str(p.body)}</p>
        </div>
      )
    case "Image":
      return (
        <img key={i} className="dd-pubimg" src={safeUrl(p.src)} alt={str(p.alt)} />
      )
    case "Divider":
      return <hr key={i} className="dd-divider" />
    case "Spacer":
      return <div key={i} style={{ height: Number(p.height) || 16 }} aria-hidden />
    case "List":
      return (
        <ul key={i} className="dd-publist">
          {(Array.isArray(p.items) ? p.items : []).map((it, j) => (
            <li key={j}>
              <IconCheck size={15} />
              <span>
                {typeof it === "string" ? it : str((it as { text?: unknown })?.text)}
              </span>
            </li>
          ))}
        </ul>
      )
    default:
      return null
  }
}

// Public view of a published builder page.
export default function PublishedPage() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug
  const [page, setPage] = useState<Page | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`${API}/api/pages/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found")
        return r.json()
      })
      .then((data) => setPage(data.content as Page))
      .catch(() => setMissing(true))
  }, [slug])

  if (missing)
    return (
      <main className="dd-container">
        <div className="dd-empty">
          <span className="dd-empty__icon" aria-hidden>
            <IconDoc size={20} />
          </span>
          <h2>Page not found</h2>
          <p>This page was unpublished or the link is wrong.</p>
          <a className="dd-btn dd-btn--sm" href="/builder">
            Browse published pages
          </a>
        </div>
      </main>
    )
  if (!page)
    return (
      <main className="dd-container dd-stack" aria-busy="true">
        <div className="dd-skeleton" style={{ minHeight: 200 }} />
        <div className="dd-skeleton" style={{ minHeight: 90 }} />
      </main>
    )

  return (
    <main className="dd-container dd-stack">
      {page.content.map((block, i) => renderBlock(block, i))}
    </main>
  )
}

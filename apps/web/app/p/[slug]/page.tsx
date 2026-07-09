"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { safeUrl } from "@discord-dashboard/builder/url"

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
        <section key={i}>
          <h1>{str(p.title)}</h1>
          <p>{str(p.subtitle)}</p>
        </section>
      )
    case "Heading":
      return <h2 key={i}>{str(p.text)}</h2>
    case "Text":
      return <p key={i}>{str(p.text)}</p>
    case "Button":
      return (
        <a key={i} href={safeUrl(p.href)}>
          {str(p.label)}
        </a>
      )
    case "Card":
      return (
        <div key={i}>
          <strong>{str(p.title)}</strong>
          <p>{str(p.body)}</p>
        </div>
      )
    case "Image":
      return (
        <img key={i} src={safeUrl(p.src)} alt={str(p.alt)} style={{ maxWidth: "100%" }} />
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

  if (missing) return <main style={{ padding: 48 }}>Page not found.</main>
  if (!page) return <main style={{ padding: 48 }}>Loading...</main>

  return (
    <main style={{ padding: 48 }}>
      {page.content.map((block, i) => renderBlock(block, i))}
    </main>
  )
}

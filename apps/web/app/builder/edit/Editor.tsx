"use client"

import "@puckeditor/core/puck.css"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Puck, useGetPuck, type Data } from "@puckeditor/core"
import { fromPuckData, puckConfig, toPuckData } from "@acstane/builder"
import { IconWand } from "../../components/icons"

const API = process.env.NEXT_PUBLIC_API ?? ""

type Load =
  | { state: "loading" }
  | { state: "ready"; data: Data; ai: boolean }
  | { state: "denied" }
  | { state: "off" }
  | { state: "error"; message: string }

async function save(slug: string, data: Partial<Data>, status: "draft" | "published") {
  const res = await fetch(`${API}/api/pages/${encodeURIComponent(slug)}`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content: fromPuckData(data, slug), status }),
  })
  const body = (await res.json().catch(() => ({}))) as { error?: string; version?: number }
  if (!res.ok) throw new Error(body.error ?? `Saving failed (${res.status})`)
  return body.version
}

// Drag and drop editor for one builder page. Pages are validated data, so the
// server checks every save against the same whitelist the public renderer uses.
export function Editor() {
  const slug = useSearchParams().get("slug") ?? ""
  const [load, setLoad] = useState<Load>({ state: "loading" })
  // Changes when a generated page replaces the editor's content.
  const [revision, setRevision] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    const opts = { credentials: "include" as const }
    Promise.all([
      fetch(`${API}/api/builder/access`, opts).then((r) => r.json()),
      fetch(`${API}/api/pages/${encodeURIComponent(slug)}/draft`, opts),
    ])
      .then(async ([access, draft]: [{ enabled?: boolean; canEdit?: boolean; ai?: boolean }, Response]) => {
        if (access.enabled === false) {
          setLoad({ state: "off" })
          return
        }
        if (!access.canEdit || draft.status === 401 || draft.status === 403) {
          setLoad({ state: "denied" })
          return
        }
        // A page that doesn't exist yet starts empty.
        const data =
          draft.status === 404
            ? { root: { props: { title: slug } }, content: [] }
            : toPuckData(((await draft.json()) as { content: Parameters<typeof toPuckData>[0] }).content)
        setLoad({ state: "ready", data, ai: Boolean(access.ai) })
      })
      .catch(() => setLoad({ state: "error", message: "Couldn't load the page." }))
  }, [slug])

  if (!slug) {
    return <Message title="No page picked" body="Open a page from the page builder." />
  }
  if (load.state === "loading") return <div className="dd-skeleton" style={{ minHeight: 480 }} />
  if (load.state === "denied") {
    return (
      <Message
        title="You can't edit pages"
        body="Ask the dashboard's owner for page editing access."
      />
    )
  }
  if (load.state === "off") {
    return <Message title="The page builder is off" body="This dashboard runs without the page builder." />
  }
  if (load.state === "error") return <Message title="Something went wrong" body={load.message} />

  const publish = async (data: Data) => {
    try {
      const version = await save(slug, data, "published")
      setNotice(`Published version ${version}.`)
    } catch (err) {
      setNotice((err as Error).message)
    }
  }

  return (
    <div className="dd-editor">
      {notice && (
        <p className="dd-editor__notice" role="status">
          {notice}
        </p>
      )}
      <Puck
        key={revision}
        config={puckConfig}
        data={load.data}
        onPublish={publish}
        headerTitle={`/${slug}`}
        headerPath="/builder"
        height="calc(100dvh - 150px)"
        overrides={{
          headerActions: ({ children }) => (
            <>
              {load.ai && (
                <GenerateButton
                  slug={slug}
                  onGenerated={(data) => {
                    setLoad({ ...load, data })
                    setRevision((r) => r + 1)
                    setNotice("Generated a draft. Review it, then publish.")
                  }}
                  onError={setNotice}
                />
              )}
              <SaveDraftButton slug={slug} onSaved={setNotice} />
              {children}
            </>
          ),
        }}
      />
    </div>
  )
}

function SaveDraftButton({ slug, onSaved }: { slug: string; onSaved: (msg: string) => void }) {
  const getPuck = useGetPuck()
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      className="dd-btn dd-btn--sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          const version = await save(slug, getPuck().appState.data, "draft")
          onSaved(`Saved draft version ${version}.`)
        } catch (err) {
          onSaved((err as Error).message)
        } finally {
          setBusy(false)
        }
      }}
    >
      Save draft
    </button>
  )
}

function GenerateButton({
  slug,
  onGenerated,
  onError,
}: {
  slug: string
  onGenerated: (data: Data) => void
  onError: (msg: string) => void
}) {
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      className="dd-btn dd-btn--sm"
      disabled={busy}
      onClick={async () => {
        const intent = window.prompt("Describe the page you want")
        if (!intent?.trim()) return
        setBusy(true)
        try {
          const res = await fetch(`${API}/api/pages/${encodeURIComponent(slug)}/generate`, {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ intent }),
          })
          const body = (await res.json().catch(() => ({}))) as {
            error?: string
            content?: Parameters<typeof toPuckData>[0]
          }
          if (!res.ok || !body.content) throw new Error(body.error ?? "Generating failed.")
          onGenerated(toPuckData(body.content))
        } catch (err) {
          onError((err as Error).message)
        } finally {
          setBusy(false)
        }
      }}
    >
      <IconWand size={14} />
      {busy ? "Generating…" : "Generate"}
    </button>
  )
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="dd-empty">
      <h2>{title}</h2>
      <p>{body}</p>
      <a className="dd-btn dd-btn--sm" href="/builder">
        Back to pages
      </a>
    </div>
  )
}

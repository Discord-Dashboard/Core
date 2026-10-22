"use client"

import { useEffect, useRef, useState } from "react"
import { IconCheck, IconSliders } from "../components/icons"
import { Field, type WireOption } from "../components/fields"

const API = process.env.NEXT_PUBLIC_API ?? ""

interface WireCategory {
  id: string
  name: string
  options: WireOption[]
}
interface Space {
  id: string
  name: string
  icon?: string | null
}

// Loads schema and values, saves changes, and subscribes to live updates so the
// form reflects changes the bot (or another admin) makes while the page is open.
export function SettingsForm({ platform, spaceId }: { platform: string; spaceId: string }) {
  const [categories, setCategories] = useState<WireCategory[] | null>(null)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [space, setSpace] = useState<Space | null>(null)
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const opts = { credentials: "include" as const }
    Promise.all([
      fetch(`${API}/api/schema`, opts).then((r) => r.json()),
      fetch(`${API}/api/spaces/${platform}/${spaceId}/values`, opts)
        .then((r) => (r.ok ? r.json() : { values: {} }))
        .catch(() => ({ values: {} })),
    ])
      .then(([schema, valuesRes]) => {
        setCategories(schema.categories ?? [])
        setValues(valuesRes.values ?? {})
      })
      .catch(() => setCategories([]))

    // Reuses the space list endpoint to show the space's name.
    fetch(`${API}/api/spaces`, opts)
      .then((r) => (r.ok ? r.json() : { spaces: [] }))
      .then((data: { platform?: string; spaces?: Space[] }) =>
        setSpace(
          data.platform === platform
            ? data.spaces?.find((s) => s.id === spaceId) ?? null
            : null
        )
      )
      .catch(() => setSpace(null))

    const es = new EventSource(`${API}/api/spaces/${platform}/${spaceId}/stream`, {
      withCredentials: true,
    })
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data)
        if (event.method === "setting.changed") {
          const { key, value } = event.params ?? {}
          if (key) setValues((v) => ({ ...v, [key]: value }))
        }
      } catch {
        // ignore malformed events
      }
    }
    return () => es.close()
  }, [platform, spaceId])

  async function save(category: string, option: string, next: unknown) {
    const key = `${category}.${option}`
    setValues((v) => ({ ...v, [key]: next }))
    if (savedTimer.current) clearTimeout(savedTimer.current)
    setSavedKey(key)
    savedTimer.current = setTimeout(() => setSavedKey(null), 1600)
    await fetch(`${API}/api/spaces/${platform}/${spaceId}/settings/${category}/${option}`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: next }),
    })
  }

  function jumpTo(catId: string) {
    setActiveCat(catId)
    document
      .getElementById(`dd-cat-${catId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const spaceName = space?.name ?? `Server ${spaceId.slice(0, 6)}…`
  const initial = (space?.name ?? "S").slice(0, 1).toUpperCase()

  return (
    <>
      <div className="dd-page-head">
        <div className="dd-guildhead">
          <span className="dd-guildhead__avatar" aria-hidden>
            {initial}
          </span>
          <div className="dd-guildhead__meta">
            <h1 className="dd-page-title" style={{ marginBottom: 0 }}>
              {spaceName}
            </h1>
            <span className="dd-guildhead__id">ID {spaceId}</span>
          </div>
        </div>
        <span className="dd-chip dd-chip--live" title="Connected to the live event stream">
          <span className="dd-pulse" aria-hidden />
          Live sync on
        </span>
      </div>
      <p className="dd-page-sub">
        Changes save instantly and sync live to everyone editing this server.
      </p>

      {!categories ? (
        <div className="dd-stack" aria-busy="true" aria-label="Loading settings">
          <div className="dd-skeleton" style={{ minHeight: 180 }} />
          <div className="dd-skeleton" style={{ minHeight: 180 }} />
        </div>
      ) : categories.length === 0 ? (
        <div className="dd-empty">
          <span className="dd-empty__icon" aria-hidden>
            <IconSliders size={20} />
          </span>
          <h2>No settings exposed</h2>
          <p>The connected bot hasn&apos;t declared a settings schema yet.</p>
        </div>
      ) : (
        <div className="dd-settings">
          <nav className="dd-catnav" aria-label="Setting categories">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`dd-catnav__btn${
                  (activeCat ?? categories[0]?.id) === cat.id ? " is-active" : ""
                }`}
                onClick={() => jumpTo(cat.id)}
              >
                <IconSliders size={15} />
                {cat.name}
              </button>
            ))}
          </nav>

          <div className="dd-settings__panels">
            {categories.map((cat) => (
              <section
                className="dd-card"
                key={cat.id}
                id={`dd-cat-${cat.id}`}
                aria-labelledby={`dd-cat-title-${cat.id}`}
              >
                <div className="dd-card__head">
                  <span className="dd-card__icon" aria-hidden>
                    <IconSliders size={16} />
                  </span>
                  <div>
                    <h2 id={`dd-cat-title-${cat.id}`} style={{ fontSize: "1.05rem" }}>
                      {cat.name}
                    </h2>
                    <p className="dd-field__hint">
                      {cat.options.length} setting{cat.options.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                {cat.options.map((opt) => {
                  const key = `${cat.id}.${opt.id}`
                  return (
                    <div className="dd-field" key={opt.id}>
                      <label className="dd-field__label" htmlFor={`dd-opt-${key}`}>
                        {opt.label ?? opt.id}
                        <span className="dd-field__hint">
                          {cat.id}.{opt.id}
                        </span>
                      </label>
                      <span className="dd-field__control">
                        {savedKey === key && (
                          <span className="dd-saved" role="status">
                            <IconCheck size={13} />
                            Saved
                          </span>
                        )}
                        <Field
                          id={`dd-opt-${key}`}
                          option={opt}
                          value={values[key]}
                          onChange={(next) => save(cat.id, opt.id, next)}
                          space={{ platform, id: spaceId }}
                        />
                      </span>
                    </div>
                  )
                })}
              </section>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

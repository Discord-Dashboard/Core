"use client"

import { useEffect, useRef, useState } from "react"
import {
  IconCheck,
  IconChevronDown,
  IconSliders,
} from "../../components/icons"

const API = process.env.NEXT_PUBLIC_API ?? "http://localhost:3001"

interface WireOption {
  id: string
  type: string
  label?: string
  enum?: { value: string; label: string }[]
}
interface WireCategory {
  id: string
  name: string
  options: WireOption[]
}
interface Guild {
  id: string
  name: string
  icon: string | null
}

// Loads schema and values, saves changes, and subscribes to live updates so the
// form reflects changes the bot (or another admin) makes while the page is open.
export function SettingsForm({ guildId }: { guildId: string }) {
  const [categories, setCategories] = useState<WireCategory[] | null>(null)
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [guild, setGuild] = useState<Guild | null>(null)
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const opts = { credentials: "include" as const }
    Promise.all([
      fetch(`${API}/api/schema`, opts).then((r) => r.json()),
      fetch(`${API}/api/guilds/${guildId}/values`, opts)
        .then((r) => (r.ok ? r.json() : { values: {} }))
        .catch(() => ({ values: {} })),
    ])
      .then(([schema, valuesRes]) => {
        setCategories(schema.categories ?? [])
        setValues(valuesRes.values ?? {})
      })
      .catch(() => setCategories([]))

    // Reuses the guild list endpoint to show the server's identity.
    fetch(`${API}/api/guilds`, opts)
      .then((r) => (r.ok ? r.json() : { guilds: [] }))
      .then((data: { guilds?: Guild[] }) =>
        setGuild(data.guilds?.find((g) => g.id === guildId) ?? null)
      )
      .catch(() => setGuild(null))

    const es = new EventSource(`${API}/api/guilds/${guildId}/stream`, {
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
  }, [guildId])

  async function save(category: string, option: string, next: unknown) {
    const key = `${category}.${option}`
    setValues((v) => ({ ...v, [key]: next }))
    if (savedTimer.current) clearTimeout(savedTimer.current)
    setSavedKey(key)
    savedTimer.current = setTimeout(() => setSavedKey(null), 1600)
    await fetch(`${API}/api/guilds/${guildId}/settings/${category}/${option}`, {
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

  const guildName = guild?.name ?? `Server ${guildId.slice(0, 6)}…`
  const initial = (guild?.name ?? "S").slice(0, 1).toUpperCase()

  return (
    <>
      <div className="dd-page-head">
        <div className="dd-guildhead">
          <span className="dd-guildhead__avatar" aria-hidden>
            {initial}
          </span>
          <div className="dd-guildhead__meta">
            <h1 className="dd-page-title" style={{ marginBottom: 0 }}>
              {guildName}
            </h1>
            <span className="dd-guildhead__id">ID {guildId}</span>
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
                  const value = values[key] ?? ""
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
                        {opt.type === "switch" ? (
                          <input
                            id={`dd-opt-${key}`}
                            type="checkbox"
                            checked={Boolean(value)}
                            onChange={(e) => save(cat.id, opt.id, e.target.checked)}
                          />
                        ) : opt.type === "select" ? (
                          <span className="dd-select">
                            <select
                              id={`dd-opt-${key}`}
                              value={String(value)}
                              onChange={(e) => save(cat.id, opt.id, e.target.value)}
                            >
                              {(opt.enum ?? []).map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                            <IconChevronDown size={14} />
                          </span>
                        ) : (
                          <input
                            id={`dd-opt-${key}`}
                            value={String(value)}
                            onChange={(e) => save(cat.id, opt.id, e.target.value)}
                          />
                        )}
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

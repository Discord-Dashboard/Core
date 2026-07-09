"use client"

import { useEffect, useState } from "react"

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

// Loads schema and values, saves changes, and subscribes to live updates so the
// form reflects changes the bot makes while the page is open.
export function SettingsForm({ guildId }: { guildId: string }) {
  const [categories, setCategories] = useState<WireCategory[] | null>(null)
  const [values, setValues] = useState<Record<string, unknown>>({})

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

  if (!categories) return <p style={{ padding: 48 }}>Loading...</p>

  async function save(key: string, next: unknown) {
    setValues((v) => ({ ...v, [key]: next }))
    await fetch(`${API}/api/guilds/${guildId}/settings/${key.replace(".", "/")}`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: next }),
    })
  }

  return (
    <div>
      {categories.map((cat) => (
        <section key={cat.id} style={{ marginBottom: 24 }}>
          <h2>{cat.name}</h2>
          {cat.options.map((opt) => {
            const key = `${cat.id}.${opt.id}`
            const value = values[key] ?? ""
            return (
              <label key={opt.id} style={{ display: "block", margin: "8px 0" }}>
                <span style={{ marginRight: 8 }}>{opt.label ?? opt.id}</span>
                {opt.type === "switch" ? (
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => save(key, e.target.checked)}
                  />
                ) : opt.type === "select" ? (
                  <select value={String(value)} onChange={(e) => save(key, e.target.value)}>
                    {(opt.enum ?? []).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input value={String(value)} onChange={(e) => save(key, e.target.value)} />
                )}
              </label>
            )
          })}
        </section>
      ))}
    </div>
  )
}

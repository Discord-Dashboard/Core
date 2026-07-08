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

// Renders any schema returned by the bot. New field types render without a
// frontend change as long as the type is known here.
export function SettingsForm({ guildId }: { guildId: string }) {
  const [categories, setCategories] = useState<WireCategory[] | null>(null)

  useEffect(() => {
    fetch(`${API}/api/schema`, { credentials: "include" })
      .then((r) => r.json())
      .then((s) => setCategories(s.categories ?? []))
      .catch(() => setCategories([]))
  }, [])

  if (!categories) return <p>Loading...</p>

  return (
    <div>
      {categories.map((cat) => (
        <section key={cat.id} style={{ marginBottom: 24 }}>
          <h2>{cat.name}</h2>
          {cat.options.map((opt) => (
            <Field
              key={opt.id}
              guildId={guildId}
              categoryId={cat.id}
              option={opt}
            />
          ))}
        </section>
      ))}
    </div>
  )
}

function Field({
  guildId,
  categoryId,
  option,
}: {
  guildId: string
  categoryId: string
  option: WireOption
}) {
  const [value, setValue] = useState<unknown>("")

  async function save(next: unknown) {
    setValue(next)
    await fetch(
      `${API}/api/guilds/${guildId}/settings/${categoryId}/${option.id}`,
      {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value: next }),
      }
    )
  }

  return (
    <label style={{ display: "block", margin: "8px 0" }}>
      <span style={{ marginRight: 8 }}>{option.label ?? option.id}</span>
      {option.type === "switch" ? (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => save(e.target.checked)}
        />
      ) : option.type === "select" ? (
        <select value={String(value)} onChange={(e) => save(e.target.value)}>
          {(option.enum ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          value={String(value)}
          onChange={(e) => save(e.target.value)}
        />
      )}
    </label>
  )
}

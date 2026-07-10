"use client"

import { useEffect, useState } from "react"

const API = process.env.NEXT_PUBLIC_API ?? "http://localhost:3001"

interface Guild {
  id: string
  name: string
  icon: string | null
}

// Lists the servers the logged in user can manage and links to each dashboard.
export default function ManagePage() {
  const [guilds, setGuilds] = useState<Guild[] | null>(null)

  useEffect(() => {
    fetch(`${API}/api/guilds`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { guilds: [] }))
      .then((data) => setGuilds(data.guilds ?? []))
      .catch(() => setGuilds([]))
  }, [])

  return (
    <main className="dd-container dd-stack">
      <div>
        <h1 className="dd-page-title">Your servers</h1>
        <p className="dd-page-sub">Pick a server to configure your bot.</p>
      </div>
      {!guilds ? (
        <p className="dd-muted">Loading...</p>
      ) : guilds.length === 0 ? (
        <div className="dd-card">
          <p>
            No manageable servers. <a href="/auth/discord">Log in</a> or invite the
            bot to a server you manage.
          </p>
        </div>
      ) : (
        <ul className="dd-list">
          {guilds.map((g) => (
            <li key={g.id}>
              <a href={`/dashboard/${g.id}`} style={{ color: "inherit" }}>
                <div className="dd-row">
                  <div className="dd-row__meta">
                    <span className="dd-row__avatar" aria-hidden>
                      {g.name.slice(0, 1).toUpperCase()}
                    </span>
                    <strong>{g.name}</strong>
                  </div>
                  <span className="dd-chip">Manage</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

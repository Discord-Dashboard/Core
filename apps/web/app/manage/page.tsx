"use client"

import { useEffect, useState } from "react"
import { IconArrowRight, IconServers } from "../components/icons"

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
    <main className="dd-stack">
      <div className="dd-page-head">
        <div>
          <h1 className="dd-page-title">Your servers</h1>
          <p className="dd-page-sub">
            Pick a server to configure your bot. Changes apply instantly.
          </p>
        </div>
        {guilds && guilds.length > 0 && (
          <span className="dd-chip dd-chip--brand">
            {guilds.length} server{guilds.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {!guilds ? (
        <div className="dd-grid" aria-busy="true" aria-label="Loading servers">
          <div className="dd-skeleton" style={{ minHeight: 132 }} />
          <div className="dd-skeleton" style={{ minHeight: 132 }} />
          <div className="dd-skeleton" style={{ minHeight: 132 }} />
        </div>
      ) : guilds.length === 0 ? (
        <div className="dd-empty">
          <span className="dd-empty__icon" aria-hidden>
            <IconServers size={20} />
          </span>
          <h2>No manageable servers</h2>
          <p>
            <a href="/auth/discord">Log in with Discord</a> or invite the bot to
            a server you manage to see it here.
          </p>
        </div>
      ) : (
        <div className="dd-grid">
          {guilds.map((g) => (
            <a className="dd-servercard" href={`/dashboard/${g.id}`} key={g.id}>
              <span className="dd-servercard__avatar" aria-hidden>
                {g.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="dd-servercard__name">{g.name}</span>
              <span className="dd-servercard__cta">
                Manage server
                <IconArrowRight size={15} />
              </span>
            </a>
          ))}
        </div>
      )}
    </main>
  )
}

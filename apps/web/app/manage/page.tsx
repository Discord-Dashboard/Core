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

  if (!guilds) return <p style={{ padding: 48 }}>Loading...</p>

  return (
    <main style={{ padding: 48 }}>
      <h1>Your servers</h1>
      {guilds.length === 0 ? (
        <p>
          No manageable servers. <a href="/auth/discord">Log in</a> or invite the
          bot to a server you manage.
        </p>
      ) : (
        <ul>
          {guilds.map((g) => (
            <li key={g.id}>
              <a href={`/dashboard/${g.id}`}>{g.name}</a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

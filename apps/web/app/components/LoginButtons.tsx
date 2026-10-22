"use client"

import { useEffect, useState } from "react"
import { IconArrowRight } from "./icons"

const API = process.env.NEXT_PUBLIC_API ?? "http://localhost:3001"

interface PlatformInfo {
  id: string
  name: string
}

// One login button per platform the dashboard is configured with.
export function LoginButtons() {
  const [platforms, setPlatforms] = useState<PlatformInfo[] | null>(null)

  useEffect(() => {
    fetch(`${API}/api/platforms`)
      .then((r) => (r.ok ? r.json() : { platforms: [] }))
      .then((data: { platforms?: PlatformInfo[] }) => setPlatforms(data.platforms ?? []))
      .catch(() => setPlatforms([]))
  }, [])

  if (!platforms) {
    return <div className="dd-skeleton" style={{ minHeight: 48 }} aria-busy="true" />
  }
  if (platforms.length === 0) {
    return <p>No login is configured yet. Add a platform to the dashboard server.</p>
  }
  return (
    <div className="dd-stack">
      {platforms.map((p) => (
        // Same origin: the web app forwards /api to the dashboard server.
        <a className="dd-btn dd-btn--primary dd-btn--lg" href={`/api/auth/${p.id}`} key={p.id}>
          Log in with {p.name}
          <IconArrowRight size={17} />
        </a>
      ))}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"

const API = process.env.NEXT_PUBLIC_API ?? ""

export interface SessionUser {
  id: string
  username?: string
  avatar?: string | null
  platform?: string
}

// undefined while loading, null when logged out.
export type Session = SessionUser | null | undefined

// One request per page load, shared by every component that asks.
let pending: Promise<SessionUser | null> | null = null

function loadSession(): Promise<SessionUser | null> {
  pending ??= fetch(`${API}/api/auth/me`, { credentials: "include" })
    .then((r) => (r.ok ? (r.json() as Promise<SessionUser>) : null))
    .catch(() => null)
  return pending
}

export function useSession(): Session {
  const [session, setSession] = useState<Session>(undefined)
  useEffect(() => {
    let live = true
    loadSession().then((s) => {
      if (live) setSession(s)
    })
    return () => {
      live = false
    }
  }, [])
  return session
}

export async function logout(): Promise<void> {
  await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(
    () => null
  )
  window.location.href = "/"
}

// The user's avatar picture, where the platform has one.
export function avatarUrl(user: SessionUser): string | null {
  if (user.platform === "discord" && user.avatar && /^[a-z0-9_]+$/i.test(user.avatar)) {
    return `https://cdn.discordapp.com/avatars/${encodeURIComponent(user.id)}/${user.avatar}.png?size=64`
  }
  return null
}

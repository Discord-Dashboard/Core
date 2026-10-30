"use client"

import { useEffect, useState, type ReactNode } from "react"

const API = process.env.NEXT_PUBLIC_API ?? ""

export interface BuilderAccess {
  // False when the server runs without the page builder, as lite mode does.
  enabled: boolean
  canEdit: boolean
  ai: boolean
}

const OFF: BuilderAccess = { enabled: false, canEdit: false, ai: false }

// One request per page load, shared by every component that asks.
let pending: Promise<BuilderAccess> | null = null

export function loadBuilderAccess(): Promise<BuilderAccess> {
  pending ??= fetch(`${API}/api/builder/access`, { credentials: "include" })
    .then((r) => (r.ok ? (r.json() as Promise<Partial<BuilderAccess>>) : OFF))
    .then((a) => ({
      // A server from before this field always had the builder.
      enabled: a.enabled ?? true,
      canEdit: Boolean(a.canEdit),
      ai: Boolean(a.ai),
    }))
    .catch(() => OFF)
  return pending
}

// undefined while loading.
export function useBuilderAccess(): BuilderAccess | undefined {
  const [access, setAccess] = useState<BuilderAccess | undefined>(undefined)
  useEffect(() => {
    let live = true
    loadBuilderAccess().then((a) => {
      if (live) setAccess(a)
    })
    return () => {
      live = false
    }
  }, [])
  return access
}

// Renders its children only when this server has the page builder.
export function BuilderOnly({ children }: { children: ReactNode }) {
  const access = useBuilderAccess()
  return access?.enabled ? <>{children}</> : null
}

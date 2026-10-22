"use client"

import { useSearchParams } from "next/navigation"
import { SettingsForm } from "./SettingsForm"

export function DashboardPage() {
  const params = useSearchParams()
  const platform = params.get("platform")
  const spaceId = params.get("space")
  if (!platform || !spaceId) {
    return (
      <p className="dd-muted">
        Pick a server on the <a href="/manage">servers page</a>.
      </p>
    )
  }
  // Keyed so switching spaces starts from a fresh form.
  return <SettingsForm key={`${platform}:${spaceId}`} platform={platform} spaceId={spaceId} />
}

"use client"

import { useEffect, useState } from "react"
import { themeToCss, themes } from "@asctane-dashboard/ui"
import { defaultTheme } from "@asctane-dashboard/theme-default"
import { IconPalette, IconChevronDown } from "./components/icons"

// Applies a theme by injecting its tokens. Because everything is built on the
// tokens, this restyles the whole app with no component changes. The default
// theme module is offered alongside the preset themes.
const options: Record<string, Record<string, string>> = {
  default: defaultTheme.tokens,
  ...themes,
}

const STORAGE_KEY = "dd-theme"

// Storage can be blocked (private windows, strict settings), so the choice is
// remembered only where it works.
function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function store(name: string) {
  try {
    localStorage.setItem(STORAGE_KEY, name)
  } catch {
    // Not remembered, but the theme still applies.
  }
}

export function ThemeSwitcher() {
  const [name, setName] = useState("default")
  useEffect(() => {
    const saved = readStored()
    if (saved && saved in options) setName(saved)
  }, [])
  return (
    <span className="dd-theme">
      <style>{themeToCss(options[name] ?? {})}</style>
      <span className="dd-theme__icon" aria-hidden>
        <IconPalette size={15} />
      </span>
      <label className="dd-visually-hidden" htmlFor="dd-theme-select">
        Theme
      </label>
      <select
        id="dd-theme-select"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          store(e.target.value)
        }}
      >
        {Object.keys(options).map((t) => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>
      <span className="dd-theme__chev" aria-hidden>
        <IconChevronDown size={13} />
      </span>
    </span>
  )
}

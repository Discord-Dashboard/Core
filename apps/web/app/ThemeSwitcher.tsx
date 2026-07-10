"use client"

import { useState } from "react"
import { themeToCss, themes } from "@discord-dashboard/ui"
import { defaultTheme } from "@discord-dashboard/theme-default"
import { IconPalette, IconChevronDown } from "./components/icons"

// Applies a theme by injecting its tokens. Because everything is built on the
// tokens, this restyles the whole app with no component changes. The default
// theme module is offered alongside the preset themes.
const options: Record<string, Record<string, string>> = {
  default: defaultTheme.tokens,
  ...themes,
}

export function ThemeSwitcher() {
  const [name, setName] = useState("default")
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
        onChange={(e) => setName(e.target.value)}
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

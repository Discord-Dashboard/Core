"use client"

import { useState } from "react"
import { themeToCss, themes } from "@discord-dashboard/ui"
import { defaultTheme } from "@discord-dashboard/theme-default"

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
      <label>Theme</label>
      <select value={name} onChange={(e) => setName(e.target.value)}>
        {Object.keys(options).map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </span>
  )
}

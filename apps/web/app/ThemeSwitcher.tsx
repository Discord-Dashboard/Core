"use client"

import { useState } from "react"
import { themeToCss, themes } from "@discord-dashboard/ui"

// Applies a theme by injecting its tokens. Because everything is built on the
// tokens, this restyles the whole app with no component changes.
export function ThemeSwitcher() {
  const [name, setName] = useState("midnight")
  return (
    <div style={{ padding: "12px 20px", textAlign: "right" }}>
      <style>{themeToCss(themes[name] ?? {})}</style>
      <label>
        Theme{" "}
        <select value={name} onChange={(e) => setName(e.target.value)}>
          {Object.keys(themes).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

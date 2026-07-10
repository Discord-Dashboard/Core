import type { DashboardTheme } from "@discord-dashboard/ui"

// The default base theme every dashboard starts with. It is a normal theme
// module, so it can be swapped for another one or extended by a marketplace
// theme. Values are plain CSS so themeToCss can render them safely.
export const defaultTheme: DashboardTheme = {
  id: "default",
  name: "Default",
  tokens: {
    "color-bg": "#0d1117",
    "color-surface": "#161b22",
    "color-text": "#e6edf3",
    "color-muted": "#8b949e",
    "color-primary": "#5865f2",
    "color-accent": "#00b3a4",
    "radius": "10px",
    "space": "16px",
  },
}

export default defaultTheme

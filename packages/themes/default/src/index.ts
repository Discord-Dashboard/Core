import type { DashboardTheme } from "@discord-dashboard/ui"

// The default base theme every dashboard starts with. A modern, high contrast
// dark theme tuned for Discord Dashboard: layered surfaces for depth, a blurple
// to violet brand gradient, soft shadows, and a full type and spacing scale.
// It is a normal theme module, so it can be swapped or extended by a marketplace
// theme. Values are plain CSS so themeToCss renders them safely.
export const defaultTheme: DashboardTheme = {
  id: "default",
  name: "Default",
  tokens: {
    // Surfaces, from deepest background to the most raised card.
    "color-bg": "#0a0c12",
    "color-bg-subtle": "#0d1017",
    "color-surface": "#141924",
    "color-surface-2": "#1b2231",
    "color-elevated": "#212a3b",
    "color-border": "#242c3b",
    "color-border-strong": "#313c50",

    // Text hierarchy (all pass WCAG AA on the surfaces above).
    "color-text": "#eef1f8",
    "color-muted": "#9aa6bd",
    "color-faint": "#6b7788",

    // Brand and semantic colors.
    "color-primary": "#5b6cff",
    "color-primary-strong": "#4553e6",
    "color-on-primary": "#ffffff",
    "color-accent": "#22d3ee",
    "color-success": "#2fbf71",
    "color-danger": "#ed4245",
    "color-warning": "#f0a832",

    // Radii, spacing and type scale.
    "radius-sm": "9px",
    "radius": "14px",
    "radius-lg": "22px",
    "radius-pill": "999px",
    "space": "16px",
    "font": "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    "font-mono": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",

    // Depth and focus.
    "shadow-sm": "0 1px 2px rgba(0,0,0,.4)",
    "shadow": "0 10px 30px -12px rgba(0,0,0,.55)",
    "shadow-lg": "0 30px 70px -24px rgba(0,0,0,.65)",
    "ring": "0 0 0 3px rgba(91,108,255,.4)",
    "gradient-brand": "linear-gradient(135deg, #5b6cff 0%, #9333ea 100%)",
    "gradient-surface": "linear-gradient(180deg, #1a2130 0%, #141924 100%)",
  },
}

export default defaultTheme

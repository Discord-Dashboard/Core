import type { DashboardTheme } from "@discord-dashboard/ui"

// The default base theme every dashboard starts with. A deep, layered dark
// theme tuned for Discord Dashboard: stacked surfaces for depth, a blurple to
// violet brand gradient, soft shadows and glows, and a full radius/space scale.
// It is a normal theme module, so it can be swapped or extended by a
// marketplace theme. Values are plain CSS so themeToCss renders them safely.
// Keep these keys/values in sync with packages/ui/src/tokens.css.
export const defaultTheme: DashboardTheme = {
  id: "default",
  name: "Default",
  tokens: {
    // Surfaces, from deepest background to the most raised card.
    "color-bg": "#07080d",
    "color-bg-subtle": "#0b0d14",
    "color-surface": "#10131c",
    "color-surface-2": "#161a26",
    "color-elevated": "#1c2130",
    "color-border": "#1f2432",
    "color-border-strong": "#2c3447",

    // Text hierarchy (all pass WCAG AA on the surfaces above).
    "color-text": "#f2f4fa",
    "color-muted": "#9aa4bc",
    "color-faint": "#667089",

    // Brand and semantic colors.
    "color-primary": "#5b6cff",
    "color-primary-strong": "#4553e6",
    "color-primary-soft": "rgba(91,108,255,0.13)",
    "color-primary-border": "rgba(105,120,255,0.36)",
    "color-on-primary": "#ffffff",
    "color-accent": "#22d3ee",
    "color-accent-soft": "rgba(34,211,238,0.12)",
    "color-success": "#2fbf71",
    "color-success-soft": "rgba(47,191,113,0.14)",
    "color-danger": "#ed4245",
    "color-danger-soft": "rgba(237,66,69,0.14)",
    "color-warning": "#f0a832",

    // Radii, spacing and type scale.
    "radius-xs": "6px",
    "radius-sm": "9px",
    "radius": "14px",
    "radius-lg": "20px",
    "radius-xl": "28px",
    "radius-pill": "999px",
    "space-xs": "6px",
    "space-sm": "10px",
    "space": "16px",
    "space-lg": "24px",
    "space-xl": "40px",
    "space-2xl": "72px",
    "font": "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    "font-mono": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",

    // Depth and focus.
    "shadow-sm": "0 1px 2px rgba(0,0,0,.45)",
    "shadow": "0 12px 32px -14px rgba(0,0,0,.6)",
    "shadow-lg": "0 32px 80px -28px rgba(0,0,0,.7)",
    "shadow-glow": "0 0 44px -8px rgba(91,108,255,.45)",
    "ring": "0 0 0 3px rgba(91,108,255,.38)",

    // Gradients.
    "gradient-brand": "linear-gradient(135deg, #5b6cff 0%, #8b5cf6 55%, #a855f7 100%)",
    "gradient-surface": "linear-gradient(180deg, #171c29 0%, #10131c 100%)",
    "gradient-text": "linear-gradient(115deg, #ffffff 20%, #b7bfff 65%, #c99aff 100%)",
    "gradient-line": "linear-gradient(90deg, transparent, #5b6cff, transparent)",
  },
}

export default defaultTheme

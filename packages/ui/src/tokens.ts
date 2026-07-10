// Typed access to the same tokens for use in JS, charts, and theme packages.
export const tokens = {
  color: {
    bg: "var(--dd-color-bg)",
    bgSubtle: "var(--dd-color-bg-subtle)",
    surface: "var(--dd-color-surface)",
    surface2: "var(--dd-color-surface-2)",
    elevated: "var(--dd-color-elevated)",
    border: "var(--dd-color-border)",
    borderStrong: "var(--dd-color-border-strong)",
    text: "var(--dd-color-text)",
    muted: "var(--dd-color-muted)",
    faint: "var(--dd-color-faint)",
    primary: "var(--dd-color-primary)",
    primaryStrong: "var(--dd-color-primary-strong)",
    onPrimary: "var(--dd-color-on-primary)",
    accent: "var(--dd-color-accent)",
    success: "var(--dd-color-success)",
    danger: "var(--dd-color-danger)",
    warning: "var(--dd-color-warning)",
  },
  radius: {
    sm: "var(--dd-radius-sm)",
    base: "var(--dd-radius)",
    lg: "var(--dd-radius-lg)",
    pill: "var(--dd-radius-pill)",
  },
  space: "var(--dd-space)",
  font: "var(--dd-font)",
  fontMono: "var(--dd-font-mono)",
  shadow: {
    sm: "var(--dd-shadow-sm)",
    base: "var(--dd-shadow)",
    lg: "var(--dd-shadow-lg)",
  },
  ring: "var(--dd-ring)",
  gradient: {
    brand: "var(--dd-gradient-brand)",
    surface: "var(--dd-gradient-surface)",
  },
} as const

export type Tokens = typeof tokens

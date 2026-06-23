// Typed access to the same tokens for use in JS, charts, and theme packages.
export const tokens = {
  color: {
    bg: "var(--dd-color-bg)",
    surface: "var(--dd-color-surface)",
    text: "var(--dd-color-text)",
    muted: "var(--dd-color-muted)",
    primary: "var(--dd-color-primary)",
    accent: "var(--dd-color-accent)",
  },
  radius: "var(--dd-radius)",
  space: "var(--dd-space)",
} as const

export type Tokens = typeof tokens

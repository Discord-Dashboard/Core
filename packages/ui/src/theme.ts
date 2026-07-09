// Themes are just token overrides. themeToCss turns a token map into a block of
// CSS custom properties you drop into a page to rebrand it, no component edits.
export function themeToCss(vars: Record<string, string>): string {
  const body = Object.entries(vars)
    .map(([key, value]) => `  --dd-${key}: ${value};`)
    .join("\n")
  return `:root {\n${body}\n}`
}

export const themes: Record<string, Record<string, string>> = {
  midnight: {
    "color-bg": "#0b0d12",
    "color-surface": "#151922",
    "color-primary": "#5865f2",
  },
  aurora: {
    "color-bg": "#0d1117",
    "color-surface": "#161b22",
    "color-primary": "#00b3a4",
  },
  daylight: {
    "color-bg": "#f6f7f9",
    "color-surface": "#ffffff",
    "color-primary": "#3b5bdb",
  },
}

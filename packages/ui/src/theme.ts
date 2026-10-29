// A theme is a named set of token overrides, shipped as a module (like a
// feature module) so it can be installed, swapped, or sold on the marketplace.
export interface DashboardTheme {
  id: string
  name: string
  tokens: Record<string, string>
}

// A theme is untrusted data (a user or a marketplace listing may supply it), and
// its values are rendered into a CSS block. These guards stop a value from
// breaking out of the declaration to inject styles or markup.
const UNSAFE_VALUE = /[;{}<>@\\]|\/\*|\*\/|url\(|expression|javascript:/i

export function isSafeThemeKey(key: string): boolean {
  return /^[a-z0-9-]{1,64}$/.test(key)
}

export function isSafeThemeValue(value: string): boolean {
  return (
    typeof value === "string" && value.length <= 128 && !UNSAFE_VALUE.test(value)
  )
}

// Whether every key and value in a theme is safe to render. Use this to accept
// or reject a theme before it is stored or published to the marketplace.
export function isSafeTheme(vars: Record<string, string>): boolean {
  return Object.entries(vars).every(
    ([key, value]) => isSafeThemeKey(key) && isSafeThemeValue(value)
  )
}

// Themes are just token overrides. themeToCss turns a token map into a block of
// CSS custom properties you drop into a page to rebrand it, no component edits.
// Unsafe entries are dropped so the output can never inject styles or markup.
export function themeToCss(vars: Record<string, string>): string {
  const body = Object.entries(vars)
    .filter(([key, value]) => isSafeThemeKey(key) && isSafeThemeValue(value))
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
  // A light theme has to replace every surface, text and depth token, or the
  // dark defaults show through. "color-scheme" also turns native controls light.
  daylight: {
    "color-scheme": "light",
    "color-bg": "#f4f6fb",
    "color-bg-subtle": "#eef1f7",
    "color-surface": "#ffffff",
    "color-surface-2": "#f5f7fb",
    "color-elevated": "#ffffff",
    "color-border": "#e2e6ee",
    "color-border-strong": "#cfd6e2",
    "color-text": "#131722",
    "color-muted": "#55607a",
    "color-faint": "#7a849a",
    "color-primary": "#3b5bdb",
    "color-primary-strong": "#2f4bc0",
    "color-primary-soft": "rgba(59,91,219,0.1)",
    "color-primary-border": "rgba(59,91,219,0.32)",
    "color-on-primary": "#ffffff",
    "color-accent": "#0891b2",
    "color-accent-soft": "rgba(8,145,178,0.1)",
    "color-success": "#1f9d57",
    "color-success-soft": "rgba(31,157,87,0.12)",
    "color-danger": "#d9363e",
    "color-danger-soft": "rgba(217,54,62,0.1)",
    "color-warning": "#b7791f",
    "shadow-sm": "0 1px 2px rgba(20,30,60,.08)",
    "shadow": "0 10px 30px -14px rgba(20,30,60,.18)",
    "shadow-lg": "0 30px 70px -28px rgba(20,30,60,.22)",
    "shadow-glow": "0 0 44px -10px rgba(59,91,219,.3)",
    "ring": "0 0 0 3px rgba(59,91,219,.28)",
    "gradient-brand": "linear-gradient(135deg, #3b5bdb 0%, #7048e8 55%, #9c36b5 100%)",
    "gradient-surface": "linear-gradient(180deg, #ffffff 0%, #f5f7fb 100%)",
    "gradient-text": "linear-gradient(115deg, #131722 20%, #3d47b8 65%, #7a3dd6 100%)",
    "gradient-line": "linear-gradient(90deg, transparent, #3b5bdb, transparent)",
  },
}

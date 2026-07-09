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
  daylight: {
    "color-bg": "#f6f7f9",
    "color-surface": "#ffffff",
    "color-primary": "#3b5bdb",
  },
}

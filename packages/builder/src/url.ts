// A page is data, not code, but component props like a Button href or an Image
// src still end up in the DOM. React does not block a "javascript:" href, so an
// unchecked url is a stored XSS vector. Only http(s), mailto and relative urls
// are allowed; everything else is treated as unsafe.
const SAFE_SCHEMES = new Set(["http:", "https:", "mailto:"])

// Control characters (tabs, newlines, nulls) can smuggle a scheme past a naive
// check, e.g. a tab inside "javascript:", so any url containing one is rejected.
function hasControlChar(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i)
    if (code < 0x20 || code === 0x7f) return true
  }
  return false
}

export function isSafeUrl(url: string): boolean {
  const trimmed = url.trim()
  if (trimmed === "") return true
  if (hasControlChar(trimmed)) return false
  // Browsers normalize backslashes to slashes, so a backslash can disguise a
  // protocol-relative url (\\evil.com). Reject them outright.
  if (trimmed.includes("\\")) return false
  // A protocol-relative url (//host) points at another origin, so it is not a
  // safe "relative" url even though it starts with a slash.
  if (trimmed.startsWith("//")) return false
  // Relative urls, queries and fragments carry no scheme and are safe.
  if (/^[/#?]/.test(trimmed)) return true
  const match = /^([a-z][a-z0-9+.-]*):/i.exec(trimmed)
  // No scheme means a relative path.
  if (!match) return true
  return SAFE_SCHEMES.has(`${match[1]!.toLowerCase()}:`)
}

// Returns the url if safe, otherwise a harmless placeholder. Used at render time
// as a last line of defense even though the schema already rejects unsafe urls.
export function safeUrl(url: unknown): string {
  return typeof url === "string" && isSafeUrl(url) ? url : "#"
}

// The props that are rendered as urls and therefore must be checked.
export const URL_PROPS = ["href", "src"] as const

import type { Platform } from "../base.js"

export interface ApiConfig {
  port: number
  cookieSecret: string
  allowedOrigins: string[]
  // The platforms people can log in with. The host builds these, for example
  // discord() from @asctane-dashboard/platform-discord; core never imports a
  // platform package itself.
  platforms: Platform[]
  rateLimit?: { max: number; timeWindow: string | number }
  webhookSecret?: string
}

export function loadConfig(platforms: Platform[] = []): ApiConfig {
  return {
    port: Number(process.env.PORT ?? 3001),
    cookieSecret: process.env.COOKIE_SECRET ?? "change-me-in-production",
    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
      .split(",")
      .map((o) => o.trim()),
    platforms,
    webhookSecret: process.env.WEBHOOK_SECRET,
  }
}

// Non fatal configuration warnings surfaced at startup.
export function validateConfig(config: ApiConfig): string[] {
  const warnings: string[] = []
  if (config.platforms.length === 0) {
    warnings.push("No platforms are configured, so nobody can log in")
  }
  for (const platform of config.platforms) {
    warnings.push(...(platform.warnings?.() ?? []))
  }
  if (process.env.NODE_ENV === "production" && !config.webhookSecret) {
    warnings.push("WEBHOOK_SECRET is not set; billing webhooks are unauthenticated")
  }
  return warnings
}

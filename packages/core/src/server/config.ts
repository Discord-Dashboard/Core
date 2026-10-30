import type { Platform } from "../base.js"

export interface ApiConfig {
  port: number
  cookieSecret: string
  allowedOrigins: string[]
  // The platforms people can log in with. The host builds these, for example
  // discord() from @acstane/platform-discord; core never imports a
  // platform package itself.
  platforms: Platform[]
  rateLimit?: { max: number; timeWindow: string | number }
  // The signing secret of a Stripe webhook endpoint (whsec_...). Stripe events
  // are only accepted with a valid Stripe-Signature for it.
  stripeWebhookSecret?: string
  // A shared secret for webhooks relayed by your own service, sent in the
  // x-webhook-secret header. Used where no platform signature is configured.
  // Stripe and Discord cannot send it themselves.
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
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
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
  return warnings
}

export interface ApiConfig {
  port: number
  cookieSecret: string
  allowedOrigins: string[]
  discord: {
    clientId: string
    clientSecret: string
    redirectUri: string
  }
  rateLimit?: { max: number; timeWindow: string | number }
  webhookSecret?: string
}

export function loadConfig(): ApiConfig {
  return {
    port: Number(process.env.PORT ?? 3001),
    cookieSecret: process.env.COOKIE_SECRET ?? "change-me-in-production",
    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
      .split(",")
      .map((o) => o.trim()),
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
      redirectUri:
        process.env.DISCORD_REDIRECT_URI ??
        "http://localhost:3001/auth/callback",
    },
    webhookSecret: process.env.WEBHOOK_SECRET,
  }
}

// Non fatal configuration warnings surfaced at startup.
export function validateConfig(config: ApiConfig): string[] {
  const warnings: string[] = []
  if (!config.discord.clientId) warnings.push("DISCORD_CLIENT_ID is not set")
  if (!config.discord.clientSecret) {
    warnings.push("DISCORD_CLIENT_SECRET is not set")
  }
  if (process.env.NODE_ENV === "production" && !config.webhookSecret) {
    warnings.push("WEBHOOK_SECRET is not set; billing webhooks are unauthenticated")
  }
  return warnings
}

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
  }
}

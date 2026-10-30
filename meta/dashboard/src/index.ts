import {
  type BotAdapter,
  buildServer,
  InProcessAdapter,
  MemoryStore,
  type ApiConfig,
  type KeyValueStore,
  SessionStore,
} from "@acstane/core"
import type { SettingsDef } from "@acstane/schema"
import { SqliteKeyValueStore, SqliteSessionBackend } from "@acstane/db"
import type { FastifyInstance } from "fastify"
import { discord, discordSourceFromClient } from "@acstane/platform-discord"
import { webRoot } from "@acstane/web"

export { defineSettings } from "@acstane/schema"
// The Discord flavored fields: typed channel and role pickers, plus embed.
export { f } from "@acstane/platform-discord"

export interface CreateDashboardOptions {
  client?: unknown
  // publicKey (or DISCORD_PUBLIC_KEY) lets the dashboard accept Discord's
  // signed SKU purchase webhooks at /api/webhooks/discord.
  discord: { clientId: string; clientSecret: string; redirectUri?: string; publicKey?: string }
  // How billing webhooks are verified. Each falls back to its environment
  // variable: STRIPE_WEBHOOK_SECRET, WEBHOOK_SECRET. A webhook with no way to
  // verify it is refused.
  billing?: { stripeWebhookSecret?: string; webhookSecret?: string }
  settings: SettingsDef
  // How settings persist. A custom store, "sqlite" for a durable local file
  // that survives restarts, or "memory" (the default) for ephemeral storage.
  // This covers settings; the audit trail stays in memory in lite mode.
  storage?: KeyValueStore | "memory" | "sqlite"
  // The SQLite file path when storage or sessions is "sqlite". Defaults to
  // data.sqlite.
  sqlitePath?: string
  // Where logged in sessions are kept. "sqlite" keeps them in the SQLite file,
  // so restarting the bot doesn't log everyone out. Defaults to "sqlite" when
  // storage is "sqlite", otherwise "memory".
  sessions?: "memory" | "sqlite"
  port?: number
  // Your own adapter instead of the in process store, such as the one fromV2
  // from @acstane/compat-v2 returns. storage is ignored then.
  adapter?: BotAdapter
  // The web dashboard served on the same port as the API. Defaults to the
  // prebuilt app from @acstane/web. Pass the root of your own static
  // build to serve that instead, or false to serve only the API.
  web?: { root: string } | false
}

export interface Dashboard {
  // Starts the server and resolves with the running Fastify instance.
  listen(port?: number): Promise<FastifyInstance>
  // A space's value for a "category.option" key, or the field's default when
  // it was never set.
  get<T = unknown>(spaceId: string, key: string): Promise<T>
}

// One call sets up the whole lite dashboard: the in process adapter, the
// server, OAuth and the settings API. No license, no external services.
export function createDashboard(opts: CreateDashboardOptions): Dashboard {
  const port = opts.port ?? 3001
  const web = opts.web === false ? undefined : (opts.web ?? { root: webRoot })
  const configFor = (listenPort: number): ApiConfig => {
    const redirectUri =
      opts.discord.redirectUri ??
      `http://localhost:${listenPort}/api/auth/discord/callback`
    // Login ends on the first allowed origin. With the web app on this server
    // that is the server's own public origin, which the redirect uri names.
    const defaultOrigin = web ? new URL(redirectUri).origin : "http://localhost:3000"
    const publicKey = opts.discord.publicKey ?? process.env.DISCORD_PUBLIC_KEY
    return {
      port: listenPort,
      cookieSecret: process.env.COOKIE_SECRET ?? "change-me-in-production",
      allowedOrigins: (process.env.ALLOWED_ORIGINS ?? defaultOrigin)
        .split(",")
        .map((o) => o.trim()),
      platforms: [
        discord({
          clientId: opts.discord.clientId,
          clientSecret: opts.discord.clientSecret,
          redirectUri,
          ...(publicKey ? { publicKey } : {}),
        }),
      ],
      stripeWebhookSecret:
        opts.billing?.stripeWebhookSecret ?? process.env.STRIPE_WEBHOOK_SECRET,
      webhookSecret: opts.billing?.webhookSecret ?? process.env.WEBHOOK_SECRET,
    }
  }

  const resolveStorage = (): KeyValueStore => {
    if (opts.storage === "sqlite") {
      return new SqliteKeyValueStore(opts.sqlitePath)
    }
    if (opts.storage && opts.storage !== "memory") return opts.storage
    return new MemoryStore()
  }

  const sessionMode = opts.sessions ?? (opts.storage === "sqlite" ? "sqlite" : "memory")
  const sessions = new SessionStore(
    sessionMode === "sqlite" ? { backend: new SqliteSessionBackend(opts.sqlitePath) } : {}
  )

  const source = opts.client ? discordSourceFromClient(opts.client) : undefined
  const adapter = opts.adapter ?? new InProcessAdapter(opts.settings, resolveStorage(), source)

  return {
    async listen(listenPort = port) {
      // Build the config for the port we actually bind, so a default OAuth
      // redirect uri follows it. A stale uri would break login with a
      // redirect_uri mismatch.
      const app = await buildServer(configFor(listenPort), {
        def: opts.settings,
        adapter,
        sessions,
        // Lite mode has no page builder: pages would only live in memory and
        // be lost on every restart. Run @acstane/core for the builder.
        pages: false,
        web,
      })
      await app.listen({ port: listenPort, host: "0.0.0.0" })
      return app
    },
    async get<T>(spaceId: string, key: string) {
      const value = await adapter.getSetting(spaceId, key)
      if (value !== null && value !== undefined) return value as T
      const dot = key.indexOf(".")
      const field = opts.settings.categories[key.slice(0, dot)]?.options[key.slice(dot + 1)]
      return (field?.opts.default ?? value) as T
    },
  }
}

import {
  buildServer,
  InProcessAdapter,
  MemoryStore,
  type ApiConfig,
  type KeyValueStore,
  type LlmClient,
} from "@asctane-dashboard/core"
import type { SettingsDef } from "@asctane-dashboard/schema"
import { SqliteKeyValueStore } from "@asctane-dashboard/db"
import type { FastifyInstance } from "fastify"
import { discord, discordSourceFromClient } from "@asctane-dashboard/platform-discord"

export { defineSettings } from "@asctane-dashboard/schema"
// The Discord flavored fields: typed channel and role pickers, plus embed.
export { f } from "@asctane-dashboard/platform-discord"

export interface CreateDashboardOptions {
  client?: unknown
  discord: { clientId: string; clientSecret: string; redirectUri?: string }
  settings: SettingsDef
  // How settings persist. A custom store, "sqlite" for a durable local file
  // that survives restarts, or "memory" (the default) for ephemeral storage.
  // This covers settings; builder pages and the audit trail stay in memory in
  // lite mode.
  storage?: KeyValueStore | "memory" | "sqlite"
  // The SQLite file path when storage is "sqlite". Defaults to data.sqlite.
  sqlitePath?: string
  port?: number
  // Discord user ids allowed to edit builder pages. Empty means page editing
  // stays closed.
  pageEditors?: string[]
  // Optional AI provider that powers page generation.
  ai?: LlmClient
}

export interface Dashboard {
  // Starts the server and resolves with the running Fastify instance.
  listen(port?: number): Promise<FastifyInstance>
}

// One call sets up the whole lite dashboard: the in process adapter, the
// server, OAuth and the settings API. No license, no external services.
export function createDashboard(opts: CreateDashboardOptions): Dashboard {
  const port = opts.port ?? 3001
  const configFor = (listenPort: number): ApiConfig => ({
    port: listenPort,
    cookieSecret: process.env.COOKIE_SECRET ?? "change-me-in-production",
    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
      .split(",")
      .map((o) => o.trim()),
    platforms: [
      discord({
        clientId: opts.discord.clientId,
        clientSecret: opts.discord.clientSecret,
        redirectUri:
          opts.discord.redirectUri ??
          `http://localhost:${listenPort}/api/auth/discord/callback`,
      }),
    ],
  })

  const resolveStorage = (): KeyValueStore => {
    if (opts.storage === "sqlite") {
      return new SqliteKeyValueStore(opts.sqlitePath)
    }
    if (opts.storage && opts.storage !== "memory") return opts.storage
    return new MemoryStore()
  }

  const source = opts.client ? discordSourceFromClient(opts.client) : undefined
  const adapter = new InProcessAdapter(opts.settings, resolveStorage(), source)

  const editors = new Set(opts.pageEditors ?? [])
  const canEditPages = editors.size
    ? (session: { userId?: string }) =>
        Boolean(session.userId && editors.has(session.userId))
    : undefined

  return {
    async listen(listenPort = port) {
      // Build the config for the port we actually bind, so a default OAuth
      // redirect uri follows it. A stale uri would break login with a
      // redirect_uri mismatch.
      const app = await buildServer(configFor(listenPort), {
        def: opts.settings,
        adapter,
        canEditPages,
        llm: opts.ai,
      })
      await app.listen({ port: listenPort, host: "0.0.0.0" })
      return app
    },
  }
}

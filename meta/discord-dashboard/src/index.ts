import { buildServer, type ApiConfig, type LlmClient } from "@discord-dashboard/api"
import {
  InProcessAdapter,
  MemoryStore,
  type KeyValueStore,
} from "@discord-dashboard/core"
import type { SettingsDef } from "@discord-dashboard/schema"
import { discordSourceFromClient } from "./discord-source.js"

export { defineSettings, f } from "@discord-dashboard/schema"

export interface CreateDashboardOptions {
  client?: unknown
  discord: { clientId: string; clientSecret: string; redirectUri?: string }
  settings: SettingsDef
  storage?: KeyValueStore
  port?: number
  // Discord user ids allowed to edit builder pages. Empty means page editing
  // stays closed.
  pageEditors?: string[]
  // Optional AI provider that powers page generation.
  ai?: LlmClient
}

// One call sets up the whole lite dashboard: the in process adapter, the
// server, OAuth and the settings API. No license, no external services.
export function createDashboard(opts: CreateDashboardOptions) {
  const port = opts.port ?? 3001
  const config: ApiConfig = {
    port,
    cookieSecret: process.env.COOKIE_SECRET ?? "change-me-in-production",
    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
      .split(",")
      .map((o) => o.trim()),
    discord: {
      clientId: opts.discord.clientId,
      clientSecret: opts.discord.clientSecret,
      redirectUri:
        opts.discord.redirectUri ?? `http://localhost:${port}/auth/callback`,
    },
  }

  const source = opts.client ? discordSourceFromClient(opts.client) : undefined
  const adapter = new InProcessAdapter(
    opts.settings,
    opts.storage ?? new MemoryStore(),
    source
  )

  const editors = new Set(opts.pageEditors ?? [])
  const canEditPages = editors.size
    ? (session: { userId?: string }) =>
        Boolean(session.userId && editors.has(session.userId))
    : undefined

  return {
    async listen(listenPort = port) {
      // Keep the OAuth redirect uri in step with the port we actually bind. If
      // the caller listens on a different port than configured and did not set
      // an explicit redirect uri, a stale uri would break login with a
      // redirect_uri mismatch, so derive it from the real port here.
      if (!opts.discord.redirectUri && listenPort !== port) {
        config.discord.redirectUri = `http://localhost:${listenPort}/auth/callback`
      }
      const app = await buildServer(config, {
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

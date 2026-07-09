import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import type { BotAdapter, Entitlements, DefSource } from "@discord-dashboard/core"
import { SettingsService } from "@discord-dashboard/core"
import {
  SESSION_COOKIE,
  canManageGuild,
  type SessionStore,
} from "../auth/session.js"
import { ProtocolEvent } from "@discord-dashboard/protocol"
import type { AuditLog } from "../audit.js"
import { DASHBOARD_SOURCE, type EventHub } from "../events-hub.js"

export interface SettingsDeps {
  def: DefSource
  adapter: BotAdapter
  sessions: SessionStore
  entitlements: Entitlements
  audit?: AuditLog
  // Live change fan out so other admins viewing the same guild update at once,
  // even in lite mode where no bot echoes the change back.
  events?: EventHub
}

export async function registerSettingsRoutes(
  app: FastifyInstance,
  deps: SettingsDeps
) {
  const service = new SettingsService(deps.def, deps.adapter, deps.entitlements)
  const resolveDef = () =>
    typeof deps.def === "function" ? deps.def() : deps.def

  // Require a logged in user who actually manages the target guild.
  function requireGuild(
    req: FastifyRequest,
    reply: FastifyReply,
    guildId: string
  ): { userId: string } | null {
    const session = deps.sessions.get(req.cookies[SESSION_COOKIE])
    if (!session?.userId) {
      reply.code(401).send({ error: "unauthorized" })
      return null
    }
    if (!canManageGuild(session, guildId)) {
      reply.code(403).send({ error: "no access to this guild" })
      return null
    }
    return { userId: session.userId }
  }

  app.get("/api/schema", async (req) => {
    const { locale } = req.query as { locale?: string }
    return deps.adapter.describeSchema(locale)
  })

  // Bulk read of all current values for a guild, with defaults applied.
  app.get("/api/guilds/:guildId/values", async (req, reply) => {
    const { guildId } = req.params as { guildId: string }
    const auth = requireGuild(req, reply, guildId)
    if (!auth) return
    const ctx = { guildId, userId: auth.userId }
    const values: Record<string, unknown> = {}
    for (const [categoryId, category] of Object.entries(resolveDef().categories)) {
      for (const optionId of Object.keys(category.options)) {
        values[`${categoryId}.${optionId}`] = await service.get(
          ctx,
          categoryId,
          optionId
        )
      }
    }
    return { values }
  })

  // Options for channel and role pickers, resolved live from the bot.
  app.get("/api/guilds/:guildId/channels", async (req, reply) => {
    const { guildId } = req.params as { guildId: string }
    if (!requireGuild(req, reply, guildId)) return
    return { channels: await deps.adapter.getChannels(guildId) }
  })

  app.get("/api/guilds/:guildId/roles", async (req, reply) => {
    const { guildId } = req.params as { guildId: string }
    if (!requireGuild(req, reply, guildId)) return
    return { roles: await deps.adapter.getRoles(guildId) }
  })

  // Trigger a bot action (a button in the dashboard, like a test message).
  app.post("/api/guilds/:guildId/actions/:name", async (req, reply) => {
    const { guildId, name } = req.params as { guildId: string; name: string }
    if (!requireGuild(req, reply, guildId)) return
    // The guild is taken from the authorized URL, never from the body, so a
    // caller cannot target a guild they do not manage.
    const result = await deps.adapter.invokeAction(guildId, name, req.body)
    return { result }
  })

  app.get("/api/guilds/:guildId/settings/:category/:option", async (req, reply) => {
    const { guildId, category, option } = req.params as {
      guildId: string
      category: string
      option: string
    }
    const auth = requireGuild(req, reply, guildId)
    if (!auth) return
    const value = await service.get({ guildId, userId: auth.userId }, category, option)
    return { value }
  })

  app.post("/api/guilds/:guildId/settings/:category/:option", async (req, reply) => {
    const { guildId, category, option } = req.params as {
      guildId: string
      category: string
      option: string
    }
    const auth = requireGuild(req, reply, guildId)
    if (!auth) return
    const { value } = (req.body ?? {}) as { value?: unknown }
    const result = await service.set(
      { guildId, userId: auth.userId },
      category,
      option,
      value
    )
    if (!result.ok) return reply.code(400).send(result)
    const key = `${category}.${option}`
    // Record who changed what, now that the write succeeded.
    deps.audit?.record({ guildId, userId: auth.userId, key, value })
    // Fan the change out to any admins watching this guild's live stream.
    deps.events?.publish({
      botId: DASHBOARD_SOURCE,
      method: ProtocolEvent.SettingChanged,
      params: { guildId, key, value },
    })
    return result
  })

  // The recent change history for a guild, for admins and compliance.
  app.get("/api/guilds/:guildId/audit", async (req, reply) => {
    const { guildId } = req.params as { guildId: string }
    if (!requireGuild(req, reply, guildId)) return
    return { entries: deps.audit?.list(guildId) ?? [] }
  })

  // Which gated features this guild currently has, so the dashboard knows what
  // to unlock. The set of features is derived from the schema's entitlement
  // gates, then each is resolved through the entitlements store.
  app.get("/api/guilds/:guildId/entitlements", async (req, reply) => {
    const { guildId } = req.params as { guildId: string }
    if (!requireGuild(req, reply, guildId)) return
    const features = new Set<string>()
    for (const category of Object.values(resolveDef().categories)) {
      if (category.entitlement) features.add(category.entitlement)
      for (const option of Object.values(category.options)) {
        const gate = (option.opts as { entitlement?: string }).entitlement
        if (gate) features.add(gate)
      }
    }
    const entitlements: Record<string, boolean> = {}
    for (const feature of features) {
      entitlements[feature] = await deps.entitlements.has(
        { type: "guild", id: guildId },
        feature
      )
    }
    return { entitlements }
  })
}

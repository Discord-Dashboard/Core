import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import type { BotAdapter, Entitlements, DefSource, Platform } from "../../base.js"
import { SettingsService, SubjectType, createPlatformRegistry } from "../../base.js"
import {
  SESSION_COOKIE,
  canManageSpace,
  type SessionStore,
} from "../auth/session.js"
import { ProtocolEvent } from "@asctane-dashboard/protocol"
import type { AuditLog } from "../audit.js"
import { DASHBOARD_SOURCE, type EventHub } from "../events-hub.js"

export interface SettingsDeps {
  def: DefSource
  adapter: BotAdapter
  sessions: SessionStore
  entitlements: Entitlements
  audit?: AuditLog
  // Live change fan out so other admins viewing the same space update at once,
  // even in lite mode where no bot echoes the change back.
  events?: EventHub
  // The configured platforms, so a picker only asks for kinds the platform has.
  platforms?: Platform[]
}

interface SpaceParams {
  platform: string
  spaceId: string
}

// Every space route lives under this prefix, so the platform and space id are
// always in the authorized URL.
const SPACE = "/api/spaces/:platform/:spaceId"

export async function registerSettingsRoutes(
  app: FastifyInstance,
  deps: SettingsDeps
) {
  const service = new SettingsService(deps.def, deps.adapter, deps.entitlements)
  const platforms = createPlatformRegistry(deps.platforms ?? [])
  const resolveDef = () =>
    typeof deps.def === "function" ? deps.def() : deps.def

  // Require a logged in user who actually manages the target space. Returns
  // the space id from the URL, the only place a space id is ever read from.
  function requireSpace(
    req: FastifyRequest,
    reply: FastifyReply
  ): { userId: string; spaceId: string } | null {
    const { platform, spaceId } = req.params as SpaceParams
    const session = deps.sessions.get(req.cookies[SESSION_COOKIE])
    if (!session?.userId) {
      reply.code(401).send({ error: "unauthorized" })
      return null
    }
    if (!canManageSpace(session, platform, spaceId)) {
      reply.code(403).send({ error: "no access to this space" })
      return null
    }
    return { userId: session.userId, spaceId }
  }

  app.get("/api/schema", async (req) => {
    const { locale } = req.query as { locale?: string }
    return deps.adapter.describeSchema(locale)
  })

  // Bulk read of all current values for a space, with defaults applied.
  app.get(`${SPACE}/values`, async (req, reply) => {
    const auth = requireSpace(req, reply)
    if (!auth) return
    const ctx = { spaceId: auth.spaceId, userId: auth.userId }
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
  app.get(`${SPACE}/channels`, async (req, reply) => {
    const auth = requireSpace(req, reply)
    if (!auth) return
    return { channels: await deps.adapter.getChannels(auth.spaceId) }
  })

  app.get(`${SPACE}/roles`, async (req, reply) => {
    const auth = requireSpace(req, reply)
    if (!auth) return
    return { roles: await deps.adapter.getRoles(auth.spaceId) }
  })

  // Options for any f.ref picker: /resources/channel, /resources/role. The
  // optional filter query is the field's JSON filter.
  app.get(`${SPACE}/resources/:kind`, async (req, reply) => {
    const { platform, kind } = req.params as SpaceParams & { kind: string }
    const auth = requireSpace(req, reply)
    if (!auth) return
    const list =
      kind === "channel"
        ? deps.adapter.getChannels
        : kind === "role"
          ? deps.adapter.getRoles
          : undefined
    if (!list || !platforms.supports(platform, kind)) {
      return reply.code(404).send({ error: "unknown resource kind" })
    }
    let filter: Record<string, unknown> | undefined
    const raw = (req.query as { filter?: string }).filter
    if (raw) {
      try {
        filter = JSON.parse(raw)
      } catch {
        return reply.code(400).send({ error: "invalid filter" })
      }
      if (!filter || typeof filter !== "object" || Array.isArray(filter)) {
        return reply.code(400).send({ error: "invalid filter" })
      }
    }
    return { items: await list.call(deps.adapter, auth.spaceId, filter) }
  })

  // Trigger a bot action (a button in the dashboard, like a test message).
  app.post(`${SPACE}/actions/:name`, async (req, reply) => {
    const { name } = req.params as { name: string }
    const auth = requireSpace(req, reply)
    if (!auth) return
    // The space is taken from the authorized URL, never from the body, so a
    // caller cannot target a space they do not manage.
    const result = await deps.adapter.invokeAction(auth.spaceId, name, req.body)
    return { result }
  })

  app.get(`${SPACE}/settings/:category/:option`, async (req, reply) => {
    const { category, option } = req.params as { category: string; option: string }
    const auth = requireSpace(req, reply)
    if (!auth) return
    const value = await service.get(
      { spaceId: auth.spaceId, userId: auth.userId },
      category,
      option
    )
    return { value }
  })

  app.post(`${SPACE}/settings/:category/:option`, async (req, reply) => {
    const { category, option } = req.params as { category: string; option: string }
    const auth = requireSpace(req, reply)
    if (!auth) return
    const { spaceId } = auth
    const { value } = (req.body ?? {}) as { value?: unknown }
    const result = await service.set(
      { spaceId, userId: auth.userId },
      category,
      option,
      value
    )
    if (!result.ok) return reply.code(400).send(result)
    const key = `${category}.${option}`
    // Record who changed what, now that the write succeeded.
    deps.audit?.record({ spaceId, userId: auth.userId, key, value })
    // Fan the change out to any admins watching this space's live stream.
    deps.events?.publish({
      botId: DASHBOARD_SOURCE,
      method: ProtocolEvent.SettingChanged,
      params: { spaceId, key, value },
    })
    return result
  })

  // The recent change history for a space, for admins and compliance.
  app.get(`${SPACE}/audit`, async (req, reply) => {
    const auth = requireSpace(req, reply)
    if (!auth) return
    return { entries: deps.audit?.list(auth.spaceId) ?? [] }
  })

  // Which gated features this space currently has, so the dashboard knows what
  // to unlock. The set of features is derived from the schema's entitlement
  // gates, then each is resolved through the entitlements store.
  app.get(`${SPACE}/entitlements`, async (req, reply) => {
    const auth = requireSpace(req, reply)
    if (!auth) return
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
        { type: SubjectType.Space, id: auth.spaceId },
        feature
      )
    }
    return { entitlements }
  })
}

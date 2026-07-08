import type { FastifyInstance } from "fastify"
import type { BotAdapter, Entitlements } from "@discord-dashboard/core"
import { SettingsService } from "@discord-dashboard/core"
import type { SettingsDef } from "@discord-dashboard/schema"
import { SESSION_COOKIE, type SessionStore } from "../auth/session.js"

export interface SettingsDeps {
  def: SettingsDef
  adapter: BotAdapter
  sessions: SessionStore
  entitlements: Entitlements
}

export async function registerSettingsRoutes(
  app: FastifyInstance,
  deps: SettingsDeps
) {
  const service = new SettingsService(deps.def, deps.adapter, deps.entitlements)

  app.get("/api/schema", async () => deps.adapter.describeSchema())

  app.get("/api/guilds/:guildId/settings/:category/:option", async (req, reply) => {
    const session = deps.sessions.get(req.cookies[SESSION_COOKIE])
    if (!session?.userId) return reply.code(401).send({ error: "unauthorized" })
    const { guildId, category, option } = req.params as {
      guildId: string
      category: string
      option: string
    }
    const value = await service.get({ guildId, userId: session.userId }, category, option)
    return { value }
  })

  app.post("/api/guilds/:guildId/settings/:category/:option", async (req, reply) => {
    const session = deps.sessions.get(req.cookies[SESSION_COOKIE])
    if (!session?.userId) return reply.code(401).send({ error: "unauthorized" })
    const { guildId, category, option } = req.params as {
      guildId: string
      category: string
      option: string
    }
    const { value } = (req.body ?? {}) as { value?: unknown }
    const result = await service.set(
      { guildId, userId: session.userId },
      category,
      option,
      value
    )
    if (!result.ok) return reply.code(400).send(result)
    return result
  })
}

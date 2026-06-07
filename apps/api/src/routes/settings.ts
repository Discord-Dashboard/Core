import type { FastifyInstance } from "fastify"

// Thin routes over the core SettingsService. Wiring to a concrete adapter and
// session is added in M1.
export async function registerSettingsRoutes(app: FastifyInstance) {
  app.get("/guilds/:guildId/settings", async (req) => {
    const { guildId } = req.params as { guildId: string }
    return { guildId, settings: {} }
  })

  app.post("/guilds/:guildId/settings/:key", async (req) => {
    const { guildId, key } = req.params as { guildId: string; key: string }
    return { ok: true, guildId, key }
  })
}

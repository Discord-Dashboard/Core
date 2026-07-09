import type { DiscordSource } from "@discord-dashboard/core"

// Maps a discord.js client to the DiscordSource interface using light duck
// typing, so this package does not hard depend on discord.js internals.
export function discordSourceFromClient(client: any): DiscordSource {
  return {
    async channels(guildId, filter) {
      const guild = client.guilds?.cache?.get(guildId)
      if (!guild) return []
      const types = filter?.types
      const out: { label: string; value: string }[] = []
      guild.channels.cache.forEach((c: any) => {
        if (types && !types.includes(String(c.type))) return
        if (filter?.hideNsfw && c.nsfw) return
        if (filter?.onlyNsfw && !c.nsfw) return
        out.push({ label: c.name, value: c.id })
      })
      return out
    },
    async roles(guildId, filter) {
      const guild = client.guilds?.cache?.get(guildId)
      if (!guild) return []
      const out: { label: string; value: string }[] = []
      guild.roles.cache.forEach((r: any) => {
        if (r.id === guildId) return
        if (r.managed && !filter?.includeBots) return
        out.push({ label: r.name, value: r.id })
      })
      return out
    },
    async memberPermissions(guildId, userId) {
      const guild = client.guilds?.cache?.get(guildId)
      const member = guild?.members?.cache?.get(userId)
      return member ? member.permissions.toArray().map(String) : []
    },
  }
}

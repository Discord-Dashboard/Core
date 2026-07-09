import type { DiscordSource } from "@discord-dashboard/core"

// Semantic channel type names (as used in schema field defs) mapped to the
// numeric discord.js ChannelType values a channel actually carries. Without
// this map a filter like ["text"] would compare "text" to "0" and drop every
// channel.
const CHANNEL_TYPE_IDS: Record<string, number[]> = {
  text: [0],
  dm: [1],
  voice: [2],
  category: [4],
  announcement: [5],
  news: [5],
  thread: [10, 11, 12],
  stage: [13],
  forum: [15],
  media: [16],
}

// Maps a discord.js client to the DiscordSource interface using light duck
// typing, so this package does not hard depend on discord.js internals.
export function discordSourceFromClient(client: any): DiscordSource {
  return {
    async channels(guildId, filter) {
      const guild = client.guilds?.cache?.get(guildId)
      if (!guild) return []
      const allowed =
        filter?.types && filter.types.length > 0
          ? new Set(filter.types.flatMap((t) => CHANNEL_TYPE_IDS[t] ?? []))
          : null
      const out: { label: string; value: string }[] = []
      guild.channels.cache.forEach((c: any) => {
        if (allowed && !allowed.has(c.type)) return
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
      if (!guild) return []
      // The member may not be cached; fetch before concluding they have no
      // permissions, otherwise a real admin can look like they have none.
      let member = guild.members?.cache?.get(userId)
      if (!member && guild.members?.fetch) {
        try {
          member = await guild.members.fetch(userId)
        } catch {
          return []
        }
      }
      return member ? member.permissions.toArray().map(String) : []
    },
  }
}

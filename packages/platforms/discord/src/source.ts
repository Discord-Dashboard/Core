import type { SpaceSource } from "@asctane-dashboard/core"

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

// The parts of the protocol's picker filters this source applies (its
// ChannelFilter and RoleFilter).
interface ChannelFilter {
  types?: string[]
  hideNsfw?: boolean
  onlyNsfw?: boolean
}
interface RoleFilter {
  includeBots?: boolean
}

// Maps a discord.js client to the SpaceSource interface using light duck
// typing, so this package does not hard depend on discord.js internals. On
// Discord a space is a guild.
export function discordSourceFromClient(client: any): SpaceSource {
  const guildOf = (spaceId: string) => client.guilds?.cache?.get(spaceId)

  async function channels(spaceId: string, filter?: ChannelFilter) {
    const guild = guildOf(spaceId)
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
  }

  async function roles(spaceId: string, filter?: RoleFilter) {
    const guild = guildOf(spaceId)
    if (!guild) return []
    const out: { label: string; value: string }[] = []
    guild.roles.cache.forEach((r: any) => {
      // The @everyone role shares the guild's id.
      if (r.id === spaceId) return
      if (r.managed && !filter?.includeBots) return
      out.push({ label: r.name, value: r.id })
    })
    return out
  }

  return {
    async resources(spaceId, kind, filter) {
      if (kind === "channel") return channels(spaceId, filter as ChannelFilter)
      if (kind === "role") return roles(spaceId, filter as RoleFilter)
      return []
    },
    async memberPermissions(spaceId, userId) {
      const guild = guildOf(spaceId)
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

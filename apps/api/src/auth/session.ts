import crypto from "node:crypto"

export interface SessionData {
  userId?: string
  username?: string
  avatar?: string | null
  guilds?: unknown[]
  pkceVerifier?: string
  state?: string
}

// Server side sessions. The Discord token never leaves the server. In the
// platform profile this is backed by Redis or the database.
export class SessionStore {
  private readonly map = new Map<string, SessionData>()

  create(): string {
    const id = crypto.randomUUID()
    this.map.set(id, {})
    return id
  }
  get(id?: string): SessionData | undefined {
    return id ? this.map.get(id) : undefined
  }
  set(id: string, data: SessionData) {
    this.map.set(id, data)
  }
  destroy(id?: string) {
    if (id) this.map.delete(id)
  }
}

export const SESSION_COOKIE = "dd_sid"

// A user may only touch guilds they manage, captured at login. This prevents a
// logged in user from editing a server they have no rights to.
export function canManageGuild(
  session: SessionData | undefined,
  guildId: string
): boolean {
  return Boolean(
    session?.guilds?.some((g) => (g as { id?: string }).id === guildId)
  )
}

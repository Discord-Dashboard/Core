import crypto from "node:crypto"

export interface SessionData {
  userId?: string
  username?: string
  avatar?: string | null
  guilds?: unknown[]
  pkceVerifier?: string
  state?: string
}

interface Entry {
  data: SessionData
  expiresAt: number
}

export interface SessionStoreOptions {
  // How long a pre auth entry (just pkce + state, no user yet) lives.
  preAuthTtlMs?: number
  // How long a logged in session lives.
  sessionTtlMs?: number
  // Hard cap on stored entries to bound memory.
  maxEntries?: number
  // How often expired entries are swept. 0 disables the timer (tests).
  sweepMs?: number
}

const MINUTE = 60_000

// Server side sessions. The Discord token never leaves the server. In the
// platform profile this is backed by Redis or the database. Entries expire and
// the map is capped so an unauthenticated flood of /auth/discord cannot grow
// memory without bound.
export class SessionStore {
  private readonly map = new Map<string, Entry>()
  private readonly preAuthTtl: number
  private readonly sessionTtl: number
  private readonly maxEntries: number
  private readonly timer?: ReturnType<typeof setInterval>

  constructor(options: SessionStoreOptions = {}) {
    this.preAuthTtl = options.preAuthTtlMs ?? 10 * MINUTE
    this.sessionTtl = options.sessionTtlMs ?? 7 * 24 * 60 * MINUTE
    this.maxEntries = options.maxEntries ?? 100_000
    const sweepMs = options.sweepMs ?? MINUTE
    if (sweepMs > 0) {
      this.timer = setInterval(() => this.sweep(), sweepMs)
      // Do not keep the process alive just for the sweep.
      this.timer.unref?.()
    }
  }

  private ttlFor(data: SessionData): number {
    return data.userId ? this.sessionTtl : this.preAuthTtl
  }

  create(): string {
    const id = crypto.randomUUID()
    this.set(id, {})
    return id
  }

  get(id?: string): SessionData | undefined {
    if (!id) return undefined
    const entry = this.map.get(id)
    if (!entry) return undefined
    if (entry.expiresAt <= Date.now()) {
      this.map.delete(id)
      return undefined
    }
    return entry.data
  }

  set(id: string, data: SessionData) {
    // Evict something if we are at the cap and this is a new id.
    if (!this.map.has(id) && this.map.size >= this.maxEntries) {
      this.evictOne()
    }
    this.map.set(id, { data, expiresAt: Date.now() + this.ttlFor(data) })
  }

  destroy(id?: string) {
    if (id) this.map.delete(id)
  }

  get size(): number {
    return this.map.size
  }

  stop() {
    if (this.timer) clearInterval(this.timer)
  }

  private sweep() {
    const t = Date.now()
    for (const [id, entry] of this.map) {
      if (entry.expiresAt <= t) this.map.delete(id)
    }
  }

  private evictOne() {
    // Prefer an already expired entry; otherwise drop the oldest inserted one.
    const t = Date.now()
    for (const [id, entry] of this.map) {
      if (entry.expiresAt <= t) {
        this.map.delete(id)
        return
      }
    }
    const oldest = this.map.keys().next().value
    if (oldest !== undefined) this.map.delete(oldest)
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

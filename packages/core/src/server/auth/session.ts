import crypto from "node:crypto"

export interface SessionData {
  // The platform the user logged in with, such as "discord".
  platform?: string
  userId?: string
  username?: string
  avatar?: string | null
  // The spaces on that platform the user may manage, captured at login.
  spaces?: { id: string }[]
  pkceVerifier?: string
  state?: string
  // The platform a login was started with, until its callback arrives.
  authPlatform?: string
}

interface Entry {
  data: SessionData
  expiresAt: number
}

// Where logged in sessions are kept besides memory, so a restart doesn't log
// everyone out. Only sessions with a user are stored; a half finished login is
// cheap to redo. Calls are synchronous so a lookup never waits on a promise.
export interface SessionBackend {
  get(id: string): { data: SessionData; expiresAt: number } | undefined
  set(id: string, data: SessionData, expiresAt: number): void
  delete(id: string): void
  // Removes every entry that expired before `now`.
  sweep?(now: number): void
}

export interface SessionStoreOptions {
  // Persists logged in sessions, such as SqliteSessionBackend from the db
  // package. Without one, sessions live in memory only.
  backend?: SessionBackend
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
// the map is capped so an unauthenticated flood of /api/auth/discord cannot grow
// memory without bound.
export class SessionStore {
  private readonly map = new Map<string, Entry>()
  private readonly preAuthTtl: number
  private readonly sessionTtl: number
  private readonly maxEntries: number
  private readonly timer?: ReturnType<typeof setInterval>
  private readonly backend?: SessionBackend

  constructor(options: SessionStoreOptions = {}) {
    this.backend = options.backend
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
    let entry = this.map.get(id)
    if (!entry && this.backend) {
      // Not in memory, for example after a restart: load it from the backend.
      entry = this.backend.get(id)
      if (entry) this.remember(id, entry)
    }
    if (!entry) return undefined
    if (entry.expiresAt <= Date.now()) {
      this.destroy(id)
      return undefined
    }
    return entry.data
  }

  set(id: string, data: SessionData) {
    const entry = { data, expiresAt: Date.now() + this.ttlFor(data) }
    this.remember(id, entry)
    if (data.userId) this.backend?.set(id, data, entry.expiresAt)
  }

  destroy(id?: string) {
    if (!id) return
    this.map.delete(id)
    this.backend?.delete(id)
  }

  private remember(id: string, entry: Entry) {
    // Evict something if we are at the cap and this is a new id.
    if (!this.map.has(id) && this.map.size >= this.maxEntries) {
      this.evictOne()
    }
    this.map.set(id, entry)
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
    this.backend?.sweep?.(t)
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

// In production the cookie is host locked with the __Host- prefix, which the
// browser only honors when it is Secure, path is /, and no Domain is set, so it
// cannot be planted by a subdomain. The prefix needs HTTPS, so plain http dev
// keeps the unprefixed name. Resolved once, used everywhere, so set and read
// always agree.
export const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-dd_sid" : "dd_sid"

// A user may only touch spaces they manage on the platform they logged in
// with, captured at login. This prevents a logged in user from editing a space
// they have no rights to.
export function canManageSpace(
  session: SessionData | undefined,
  platform: string,
  spaceId: string
): boolean {
  if (!session?.platform || session.platform !== platform) return false
  return Boolean(session.spaces?.some((s) => s.id === spaceId))
}

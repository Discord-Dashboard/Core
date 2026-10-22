import type { OptionListItem } from "@asctane-dashboard/protocol"
import type { Field } from "@asctane-dashboard/schema"
import type { EntitlementSubject } from "./entitlements.js"

// A space is where a bot's settings apply: a Discord server, a Slack
// workspace, a Telegram group or a Twitch channel. Core only ever sees spaces;
// each platform package maps its own concept onto one.
export interface SpaceRef {
  platform: string
  id: string
}

// Lowercase, starts with a letter: "discord", "slack", "my-chat".
const PLATFORM_ID = /^[a-z][a-z0-9-]*$/

export function isPlatformId(id: string): boolean {
  return PLATFORM_ID.test(id)
}

// The single string form of a space, used as a storage and cache key. The
// platform id cannot contain ":", so the first ":" always splits it, and a
// space id may itself contain ":".
export function spaceKey(ref: SpaceRef): string {
  if (!isPlatformId(ref.platform)) {
    throw new Error(`invalid platform id: ${ref.platform}`)
  }
  if (!ref.id) throw new Error("space id is empty")
  return `${ref.platform}:${ref.id}`
}

export function parseSpaceKey(key: string): SpaceRef {
  const at = key.indexOf(":")
  const ref = { platform: key.slice(0, at), id: key.slice(at + 1) }
  if (at <= 0 || !isPlatformId(ref.platform) || !ref.id) {
    throw new Error(`invalid space key: ${key}`)
  }
  return ref
}

// The kinds of things a setting can point at inside a space. A platform lists
// the kinds it supports; Telegram, for example, has no roles.
export type ResourceKind = "channel" | "role" | (string & {})

// Who logged in, as the platform reports it.
export interface Identity {
  id: string
  username: string
  avatar?: string | null
}

// A space the logged in user may manage, for the space picker.
export interface SpaceSummary {
  id: string
  name: string
  icon?: string | null
}

// Each platform owns its client credentials and the redirect uri registered
// with them, so the contexts only carry what changes per login.
export interface AuthStartContext {
  state: string
  codeChallenge: string
}

// Most platforms log in with an OAuth redirect. Telegram uses a signed login
// widget instead, so the start step can also hand the web app a widget config.
export type AuthStart =
  | { kind: "redirect"; url: string }
  | { kind: "widget"; config: Record<string, unknown> }

export interface AuthFinishContext {
  codeVerifier: string
  // The callback's query string (OAuth code, or the widget's signed fields).
  query: Record<string, string | undefined>
}

export interface AuthResult {
  user: Identity
  // Only spaces the user may manage. Filtering happens here, in the platform,
  // because each platform has its own permission model.
  spaces: SpaceSummary[]
}

export interface AuthProvider {
  start(ctx: AuthStartContext): AuthStart | Promise<AuthStart>
  finish(ctx: AuthFinishContext): Promise<AuthResult>
}

// Live data about a space, read from the bot's own client in lite mode.
export interface SpaceSource {
  resources(
    spaceId: string,
    kind: ResourceKind,
    filter?: unknown
  ): Promise<OptionListItem[]>
  memberPermissions(spaceId: string, userId: string): Promise<string[]>
}

// What a platform billing event grants or takes away, for example a Discord
// SKU purchase. The billing package stores these next to Stripe grants.
export interface PlatformGrant {
  subject: EntitlementSubject
  feature: string
  active: boolean
}

export interface PlatformBilling {
  // Turns a verified webhook body from the platform into grants.
  grantsFromWebhook(body: unknown): PlatformGrant[]
}

// Everything core needs from one platform. Core never imports a platform
// package; the host passes a list of these in.
export interface Platform {
  id: string
  // Shown on the login button: "Discord".
  name: string
  auth: AuthProvider
  resources: readonly ResourceKind[]
  // Wraps the bot's client (discord.js, Bolt, grammY...) for lite mode.
  source?: (client: unknown) => SpaceSource
  // Field types only this platform has, such as Discord's embed.
  fields?: Record<string, (...args: any[]) => Field>
  billing?: PlatformBilling
  // Non fatal configuration problems, such as a missing client secret, shown
  // at startup.
  warnings?: () => string[]
}

// Checks a platform definition early, so a typo fails at startup instead of
// on the first login.
export function definePlatform<P extends Platform>(platform: P): P {
  if (!isPlatformId(platform.id)) {
    throw new Error(`invalid platform id: ${platform.id}`)
  }
  if (new Set(platform.resources).size !== platform.resources.length) {
    throw new Error(`platform ${platform.id} lists a resource kind twice`)
  }
  return platform
}

export interface PlatformRegistry {
  get(id: string): Platform | undefined
  list(): Platform[]
  supports(id: string, kind: ResourceKind): boolean
}

export function createPlatformRegistry(platforms: Platform[]): PlatformRegistry {
  const byId = new Map<string, Platform>()
  for (const p of platforms) {
    if (byId.has(p.id)) throw new Error(`platform ${p.id} is registered twice`)
    byId.set(p.id, definePlatform(p))
  }
  return {
    get: (id) => byId.get(id),
    list: () => [...byId.values()],
    supports: (id, kind) => byId.get(id)?.resources.includes(kind) ?? false,
  }
}

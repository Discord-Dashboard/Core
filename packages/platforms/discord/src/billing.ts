import crypto from "node:crypto"
import {
  SubjectType,
  type PlatformBilling,
  type PlatformGrant,
  type WebhookRequest,
} from "@acstane/core"

// The parts of a Discord entitlement object that matter here.
interface DiscordEntitlement {
  guild_id?: string
  user_id?: string
  sku_id?: string
  deleted?: boolean
  ends_at?: string | null
}

// Discord webhook events arrive in this envelope. type 0 is the PING Discord
// sends when the URL is saved, type 1 an event.
interface DiscordWebhookEvent {
  type?: number
  event?: { type?: string; data?: DiscordEntitlement }
}

const EVENT = 1
const ENTITLEMENT_EVENTS = new Set([
  "ENTITLEMENT_CREATE",
  "ENTITLEMENT_UPDATE",
  "ENTITLEMENT_DELETE",
])

function grantsFrom(ent: DiscordEntitlement, removed: boolean): PlatformGrant[] {
  const id = ent.guild_id ?? ent.user_id
  if (!ent.sku_id || !id) return []
  const endsAt = ent.ends_at ? Math.floor(Date.parse(ent.ends_at) / 1000) : undefined
  const ended = endsAt !== undefined && !Number.isNaN(endsAt) && endsAt <= Date.now() / 1000
  return [
    {
      subject: { type: ent.guild_id ? SubjectType.Space : SubjectType.User, id },
      feature: ent.sku_id,
      active: !removed && !ent.deleted && !ended,
      ...(endsAt !== undefined && !Number.isNaN(endsAt) ? { expiresAt: endsAt } : {}),
    },
  ]
}

// Discord SKU purchases. A guild subscription unlocks the feature for that
// server, a user subscription for that user. The SKU id is the feature name.
// Reads Discord's webhook event envelope (ENTITLEMENT_CREATE, _UPDATE and
// _DELETE), and a bare entitlement object for a relay that forwards only that.
export const discordBilling: PlatformBilling = {
  grantsFromWebhook(body) {
    const payload = (body ?? {}) as DiscordWebhookEvent & DiscordEntitlement
    if (typeof payload.type === "number") {
      const type = payload.event?.type
      if (payload.type !== EVENT || !type || !ENTITLEMENT_EVENTS.has(type)) return []
      return grantsFrom(payload.event?.data ?? {}, type === "ENTITLEMENT_DELETE")
    }
    return grantsFrom(payload, false)
  },
}

// The DER prefix that turns a raw 32 byte Ed25519 public key into SPKI, the
// form node:crypto imports.
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex")

// Discord signs `${X-Signature-Timestamp}${rawBody}` with the application's
// Ed25519 key and sends the signature in X-Signature-Ed25519, both hex. The
// public key is on the application's General Information page.
export function discordSignatureVerifier(publicKey: string): (req: WebhookRequest) => boolean {
  if (!/^[0-9a-f]{64}$/i.test(publicKey)) {
    throw new Error("the Discord public key must be 64 hex characters")
  }
  const key = crypto.createPublicKey({
    key: Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(publicKey, "hex")]),
    format: "der",
    type: "spki",
  })
  return ({ headers, rawBody }) => {
    const signature = headers["x-signature-ed25519"]
    const timestamp = headers["x-signature-timestamp"]
    if (typeof signature !== "string" || typeof timestamp !== "string") return false
    if (!/^[0-9a-f]{128}$/i.test(signature)) return false
    try {
      return crypto.verify(
        null,
        Buffer.from(timestamp + rawBody),
        key,
        Buffer.from(signature, "hex")
      )
    } catch {
      return false
    }
  }
}

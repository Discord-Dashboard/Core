import crypto from "node:crypto"
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { createPlatformRegistry, type Platform } from "../../base.js"
import {
  grantFromStripeSubscription,
  grantFromPlatform,
} from "../../billing/index.js"
import type { MemoryGrantStore } from "../billing.js"

export interface BillingSecrets {
  // The Stripe endpoint signing secret (whsec_...).
  stripeWebhookSecret?: string
  // A shared secret in the x-webhook-secret header, for your own relays.
  webhookSecret?: string
}

// How far a Stripe-Signature timestamp may be from now, as in Stripe's own
// libraries. Older signatures are replays.
const STRIPE_TOLERANCE_SECONDS = 300

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}

function header(req: FastifyRequest, name: string): string | undefined {
  const value = req.headers[name]
  return typeof value === "string" ? value : undefined
}

// Stripe signs `${timestamp}.${rawBody}` with HMAC-SHA256 and sends
// "t=<timestamp>,v1=<hex>" (more than one v1 while a secret is being rolled).
export function verifyStripeSignature(
  rawBody: string,
  signature: string | undefined,
  secret: string,
  now = Math.floor(Date.now() / 1000)
): boolean {
  if (!signature) return false
  let timestamp: string | undefined
  const candidates: string[] = []
  for (const part of signature.split(",")) {
    const at = part.indexOf("=")
    const key = part.slice(0, at).trim()
    const value = part.slice(at + 1).trim()
    if (key === "t") timestamp = value
    else if (key === "v1") candidates.push(value)
  }
  if (!timestamp || !/^\d+$/.test(timestamp) || candidates.length === 0) return false
  if (Math.abs(now - Number(timestamp)) > STRIPE_TOLERANCE_SECONDS) return false
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex")
  return candidates.some((c) => safeEqual(c, expected))
}

// Checkout uses Stripe hosted pages so no card data touches this server.
// Webhooks reduce every billing source to the same grant shape. Because a
// webhook grants entitlements, it is only accepted when it is verified: by the
// sender's own signature (Stripe, or a platform such as Discord), or else by
// the shared secret header. With neither configured the webhook is refused,
// never accepted unchecked.
export async function registerBillingRoutes(
  app: FastifyInstance,
  store: MemoryGrantStore,
  secrets: BillingSecrets = {},
  platforms: Platform[] = []
) {
  const registry = createPlatformRegistry(platforms)
  const { stripeWebhookSecret, webhookSecret } = secrets

  function sharedSecretOk(req: FastifyRequest): boolean {
    const provided = header(req, "x-webhook-secret")
    return Boolean(webhookSecret && provided && safeEqual(provided, webhookSecret))
  }

  function notConfigured(reply: FastifyReply) {
    return reply.code(503).send({ error: "webhook verification is not configured" })
  }

  function unauthorized(reply: FastifyReply) {
    return reply.code(401).send({ error: "invalid webhook signature" })
  }

  app.post("/api/billing/checkout", async (req) => {
    const { plan, subjectId } = (req.body ?? {}) as {
      plan?: string
      subjectId?: string
    }
    return { plan, subjectId, url: "https://checkout.stripe.com/pay/session" }
  })

  // Signatures cover the exact bytes that were sent, so the webhook routes
  // keep the raw body next to the parsed one. Scoped to this plugin, so every
  // other route parses JSON as before.
  await app.register(async (hooks) => {
    hooks.addContentTypeParser(
      "application/json",
      { parseAs: "string" },
      (req, body, done) => {
        const raw = typeof body === "string" ? body : body.toString("utf8")
        ;(req as FastifyRequest & { rawBody?: string }).rawBody = raw
        try {
          done(null, raw === "" ? {} : JSON.parse(raw))
        } catch {
          const err = new Error("invalid json") as Error & { statusCode: number }
          err.statusCode = 400
          done(err, undefined)
        }
      }
    )
    const rawBodyOf = (req: FastifyRequest) =>
      (req as FastifyRequest & { rawBody?: string }).rawBody ?? ""

    hooks.post("/api/webhooks/stripe", async (req, reply) => {
      if (stripeWebhookSecret) {
        const signature = header(req, "stripe-signature")
        if (!verifyStripeSignature(rawBodyOf(req), signature, stripeWebhookSecret)) {
          return unauthorized(reply)
        }
      } else if (webhookSecret) {
        if (!sharedSecretOk(req)) return unauthorized(reply)
      } else {
        return notConfigured(reply)
      }
      const event = (req.body ?? {}) as {
        type?: string
        data?: { object?: any }
      }
      if (event.type?.startsWith("customer.subscription") && event.data?.object) {
        store.add(grantFromStripeSubscription(event.data.object))
      }
      return reply.send({ received: true })
    })

    // Purchases made on a platform, such as Discord SKUs at
    // /api/webhooks/discord. The platform's billing hook verifies and reads
    // the body.
    hooks.post("/api/webhooks/:platform", async (req, reply) => {
      const platform = registry.get((req.params as { platform: string }).platform)
      const billing = platform?.billing
      if (!platform || !billing) return reply.code(404).send({ error: "not found" })
      if (billing.verify) {
        const ok = billing.verify({ headers: req.headers, rawBody: rawBodyOf(req) })
        if (!ok) return unauthorized(reply)
      } else if (webhookSecret) {
        if (!sharedSecretOk(req)) return unauthorized(reply)
      } else {
        return notConfigured(reply)
      }
      for (const grant of billing.grantsFromWebhook(req.body)) {
        store.add(grantFromPlatform(platform.id, grant))
      }
      // A platform that signs its webhooks (Discord) expects an empty 204,
      // for its PING check as well as for events.
      if (billing.verify) return reply.code(204).send()
      return reply.send({ received: true })
    })
  })
}

import crypto from "node:crypto"
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { createPlatformRegistry, type Platform } from "../../base.js"
import {
  grantFromStripeSubscription,
  grantFromPlatform,
} from "../../billing/index.js"
import type { MemoryGrantStore } from "../billing.js"

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}

// Checkout uses Stripe hosted pages so no card data touches this server.
// Webhooks reduce every billing source to the same grant shape. Because a
// webhook grants entitlements, it must be authenticated: when a secret is
// configured, callers must present it.
export async function registerBillingRoutes(
  app: FastifyInstance,
  store: MemoryGrantStore,
  webhookSecret?: string,
  platforms: Platform[] = []
) {
  const registry = createPlatformRegistry(platforms)

  function verify(req: FastifyRequest, reply: FastifyReply): boolean {
    if (!webhookSecret) return true
    const provided = req.headers["x-webhook-secret"]
    if (typeof provided === "string" && safeEqual(provided, webhookSecret)) {
      return true
    }
    reply.code(401).send({ error: "invalid webhook secret" })
    return false
  }

  app.post("/api/billing/checkout", async (req) => {
    const { plan, subjectId } = (req.body ?? {}) as {
      plan?: string
      subjectId?: string
    }
    return { plan, subjectId, url: "https://checkout.stripe.com/pay/session" }
  })

  app.post("/api/webhooks/stripe", async (req, reply) => {
    if (!verify(req, reply)) return
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
  // /api/webhooks/discord. The platform's billing hook reads the body.
  app.post("/api/webhooks/:platform", async (req, reply) => {
    const platform = registry.get((req.params as { platform: string }).platform)
    if (!platform?.billing) return reply.code(404).send({ error: "not found" })
    if (!verify(req, reply)) return
    for (const grant of platform.billing.grantsFromWebhook(req.body)) {
      store.add(grantFromPlatform(platform.id, grant))
    }
    return reply.send({ received: true })
  })
}

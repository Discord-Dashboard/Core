import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import {
  grantFromStripeSubscription,
  grantFromDiscordEntitlement,
} from "@discord-dashboard/billing"
import type { MemoryGrantStore } from "../billing.js"

// Checkout uses Stripe hosted pages so no card data touches this server.
// Webhooks reduce both billing sources to the same grant shape. Because a
// webhook grants entitlements, it must be authenticated: when a secret is
// configured, callers must present it.
export async function registerBillingRoutes(
  app: FastifyInstance,
  store: MemoryGrantStore,
  webhookSecret?: string
) {
  function verify(req: FastifyRequest, reply: FastifyReply): boolean {
    if (!webhookSecret) return true
    if (req.headers["x-webhook-secret"] === webhookSecret) return true
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

  app.post("/webhooks/stripe", async (req, reply) => {
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

  app.post("/webhooks/discord", async (req, reply) => {
    if (!verify(req, reply)) return
    store.add(grantFromDiscordEntitlement(req.body as any))
    return reply.send({ received: true })
  })
}

import type { FastifyInstance } from "fastify"
import {
  grantFromStripeSubscription,
  grantFromDiscordEntitlement,
} from "@discord-dashboard/billing"
import type { MemoryGrantStore } from "../billing.js"

// Checkout uses Stripe hosted pages so no card data touches this server.
// Webhooks reduce both billing sources to the same grant shape.
export async function registerBillingRoutes(
  app: FastifyInstance,
  store: MemoryGrantStore
) {
  app.post("/api/billing/checkout", async (req) => {
    const { plan, subjectId } = (req.body ?? {}) as {
      plan?: string
      subjectId?: string
    }
    return { plan, subjectId, url: "https://checkout.stripe.com/pay/session" }
  })

  app.post("/webhooks/stripe", async (req, reply) => {
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
    store.add(grantFromDiscordEntitlement(req.body as any))
    return reply.send({ received: true })
  })
}

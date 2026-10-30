import { describe, it, expect, beforeEach, afterEach } from "vitest"
import crypto from "node:crypto"
import type { FastifyInstance } from "fastify"
import { buildServer } from "./server.js"
import type { ApiConfig } from "./config.js"
import { verifyStripeSignature } from "./routes/billing.js"
import { SessionStore, SESSION_COOKIE } from "./auth/session.js"
import { InProcessAdapter, MemoryStore } from "../base.js"
import { defineSettings, f } from "@acstane/schema"
import { discord } from "@acstane/platform-discord"

const def = defineSettings((s) => ({
  pro: s.category({ name: "Pro", entitlement: "pro", options: { color: f.text() } }),
}))

// A Discord style application key pair: the public key as the 64 hex
// characters the Developer Portal shows.
const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519")
const publicKeyHex = publicKey
  .export({ format: "der", type: "spki" })
  .subarray(-32)
  .toString("hex")

function discordSigned(body: unknown, key = privateKey) {
  const payload = JSON.stringify(body)
  const timestamp = String(Math.floor(Date.now() / 1000))
  const signature = crypto.sign(null, Buffer.from(timestamp + payload), key).toString("hex")
  return {
    payload,
    headers: {
      "content-type": "application/json",
      "x-signature-ed25519": signature,
      "x-signature-timestamp": timestamp,
    },
  }
}

const STRIPE_SECRET = "whsec_test_secret"

function stripeSigned(body: unknown, secret = STRIPE_SECRET, t = Math.floor(Date.now() / 1000)) {
  const payload = JSON.stringify(body)
  const sig = crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex")
  return {
    payload,
    headers: { "content-type": "application/json", "stripe-signature": `t=${t},v1=${sig}` },
  }
}

const entitlement = (type: string, data: Record<string, unknown>) => ({
  version: 1,
  application_id: "app",
  type: 1,
  event: { type, timestamp: new Date().toISOString(), data },
})

const subscription = {
  type: "customer.subscription.created",
  data: {
    object: {
      id: "sub_1",
      status: "active",
      metadata: { subjectType: "space", subjectId: "g", feature: "pro" },
    },
  },
}

async function serverWith(extra: Partial<ApiConfig>) {
  const sessions = new SessionStore({ sweepMs: 0 })
  const sid = sessions.create()
  sessions.set(sid, { userId: "u1", platform: "discord", spaces: [{ id: "g", name: "G", icon: null }] })
  const app = await buildServer(
    {
      port: 0,
      cookieSecret: "test-secret-at-least-32-chars-long-000",
      allowedOrigins: ["http://localhost:3000"],
      platforms: [
        discord({ clientId: "c", clientSecret: "s", redirectUri: "http://x/cb", publicKey: publicKeyHex }),
      ],
      ...extra,
    },
    { def, adapter: new InProcessAdapter(def, new MemoryStore()), sessions }
  )
  const hasPro = async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/spaces/discord/g/entitlements",
      headers: { cookie: `${SESSION_COOKIE}=${sid}` },
    })
    return (res.json() as { entitlements: Record<string, boolean> }).entitlements.pro
  }
  return { app, hasPro }
}

describe("discord webhook signatures", () => {
  let app: FastifyInstance
  let hasPro: () => Promise<boolean | undefined>
  beforeEach(async () => {
    ;({ app, hasPro } = await serverWith({}))
  })
  afterEach(async () => {
    await app.close()
  })

  it("answers Discord's signed PING with an empty 204", async () => {
    const res = await app.inject({ method: "POST", url: "/api/webhooks/discord", ...discordSigned({ version: 1, type: 0 }) })
    expect(res.statusCode).toBe(204)
    expect(res.body).toBe("")
  })

  it("grants a signed ENTITLEMENT_CREATE and revokes it on ENTITLEMENT_DELETE", async () => {
    expect(await hasPro()).toBe(false)
    const create = await app.inject({
      method: "POST",
      url: "/api/webhooks/discord",
      ...discordSigned(entitlement("ENTITLEMENT_CREATE", { guild_id: "g", sku_id: "pro" })),
    })
    expect(create.statusCode).toBe(204)
    expect(await hasPro()).toBe(true)

    await app.inject({
      method: "POST",
      url: "/api/webhooks/discord",
      ...discordSigned(entitlement("ENTITLEMENT_DELETE", { guild_id: "g", sku_id: "pro" })),
    })
    expect(await hasPro()).toBe(false)
  })

  it("treats an ENTITLEMENT_UPDATE that has ended as inactive", async () => {
    await app.inject({
      method: "POST",
      url: "/api/webhooks/discord",
      ...discordSigned(entitlement("ENTITLEMENT_CREATE", { guild_id: "g", sku_id: "pro" })),
    })
    await app.inject({
      method: "POST",
      url: "/api/webhooks/discord",
      ...discordSigned(
        entitlement("ENTITLEMENT_UPDATE", {
          guild_id: "g",
          sku_id: "pro",
          ends_at: new Date(Date.now() - 60_000).toISOString(),
        })
      ),
    })
    expect(await hasPro()).toBe(false)
  })

  it("refuses an unsigned, a forged and a tampered webhook", async () => {
    const body = entitlement("ENTITLEMENT_CREATE", { guild_id: "g", sku_id: "pro" })
    const unsigned = await app.inject({ method: "POST", url: "/api/webhooks/discord", payload: body })
    expect(unsigned.statusCode).toBe(401)

    const otherKey = crypto.generateKeyPairSync("ed25519").privateKey
    const forged = await app.inject({ method: "POST", url: "/api/webhooks/discord", ...discordSigned(body, otherKey) })
    expect(forged.statusCode).toBe(401)

    const signed = discordSigned(body)
    const tampered = await app.inject({
      method: "POST",
      url: "/api/webhooks/discord",
      headers: signed.headers,
      payload: signed.payload.replace('"g"', '"other"'),
    })
    expect(tampered.statusCode).toBe(401)
    expect(await hasPro()).toBe(false)
  })

  it("does not take the shared secret instead of Discord's signature", async () => {
    await app.close()
    ;({ app, hasPro } = await serverWith({ webhookSecret: "hook-secret" }))
    const res = await app.inject({
      method: "POST",
      url: "/api/webhooks/discord",
      headers: { "x-webhook-secret": "hook-secret" },
      payload: { guild_id: "g", sku_id: "pro" },
    })
    expect(res.statusCode).toBe(401)
    expect(await hasPro()).toBe(false)
  })
})

describe("stripe webhook signatures", () => {
  it("is refused when nothing can verify it", async () => {
    const { app, hasPro } = await serverWith({})
    const res = await app.inject({ method: "POST", url: "/api/webhooks/stripe", payload: subscription })
    expect(res.statusCode).toBe(503)
    expect(await hasPro()).toBe(false)
    await app.close()
  })

  it("accepts a valid Stripe-Signature and refuses forged or stale ones", async () => {
    const { app, hasPro } = await serverWith({ stripeWebhookSecret: STRIPE_SECRET })

    const unsigned = await app.inject({ method: "POST", url: "/api/webhooks/stripe", payload: subscription })
    expect(unsigned.statusCode).toBe(401)

    const wrongSecret = await app.inject({
      method: "POST",
      url: "/api/webhooks/stripe",
      ...stripeSigned(subscription, "whsec_someone_else"),
    })
    expect(wrongSecret.statusCode).toBe(401)

    const stale = await app.inject({
      method: "POST",
      url: "/api/webhooks/stripe",
      ...stripeSigned(subscription, STRIPE_SECRET, Math.floor(Date.now() / 1000) - 3600),
    })
    expect(stale.statusCode).toBe(401)
    expect(await hasPro()).toBe(false)

    const ok = await app.inject({ method: "POST", url: "/api/webhooks/stripe", ...stripeSigned(subscription) })
    expect(ok.statusCode).toBe(200)
    expect(await hasPro()).toBe(true)
    await app.close()
  })

  it("accepts any of several v1 signatures, as while a secret is rolled", () => {
    const body = "{}"
    const t = 1_700_000_000
    const sig = crypto.createHmac("sha256", STRIPE_SECRET).update(`${t}.${body}`).digest("hex")
    const header = `t=${t},v1=${"0".repeat(64)},v1=${sig}`
    expect(verifyStripeSignature(body, header, STRIPE_SECRET, t)).toBe(true)
    expect(verifyStripeSignature(body, `t=${t}`, STRIPE_SECRET, t)).toBe(false)
    expect(verifyStripeSignature(body, `v1=${sig}`, STRIPE_SECRET, t)).toBe(false)
    expect(verifyStripeSignature(body, undefined, STRIPE_SECRET, t)).toBe(false)
  })

  it("answers malformed json with 400", async () => {
    const { app } = await serverWith({ stripeWebhookSecret: STRIPE_SECRET })
    const res = await app.inject({
      method: "POST",
      url: "/api/webhooks/stripe",
      headers: { "content-type": "application/json" },
      payload: "{not json",
    })
    expect(res.statusCode).toBe(400)
    await app.close()
  })
})

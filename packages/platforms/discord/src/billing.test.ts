import crypto from "node:crypto"
import { describe, expect, it } from "vitest"
import { discordBilling, discordSignatureVerifier } from "./billing.js"

const event = (type: string, data: Record<string, unknown>) => ({
  version: 1,
  application_id: "app",
  type: 1,
  event: { type, timestamp: "2026-01-01T00:00:00Z", data },
})

describe("discord billing", () => {
  it("grants a guild subscription to the space", () => {
    expect(discordBilling.grantsFromWebhook({ guild_id: "g", sku_id: "sku" })).toEqual([
      { subject: { type: "space", id: "g" }, feature: "sku", active: true },
    ])
  })
  it("grants a user subscription to the user and cancels a deleted one", () => {
    expect(
      discordBilling.grantsFromWebhook({ user_id: "u", sku_id: "sku", deleted: true })
    ).toEqual([{ subject: { type: "user", id: "u" }, feature: "sku", active: false }])
  })
  it("ignores a body without a SKU or a subject", () => {
    expect(discordBilling.grantsFromWebhook({ guild_id: "g" })).toEqual([])
    expect(discordBilling.grantsFromWebhook({ sku_id: "sku" })).toEqual([])
    expect(discordBilling.grantsFromWebhook(null)).toEqual([])
  })
  it("reads Discord's webhook event envelope", () => {
    expect(
      discordBilling.grantsFromWebhook(event("ENTITLEMENT_CREATE", { guild_id: "g", sku_id: "sku" }))
    ).toEqual([{ subject: { type: "space", id: "g" }, feature: "sku", active: true }])
    expect(
      discordBilling.grantsFromWebhook(event("ENTITLEMENT_DELETE", { guild_id: "g", sku_id: "sku" }))
    ).toEqual([{ subject: { type: "space", id: "g" }, feature: "sku", active: false }])
  })
  it("carries ends_at as the grant's expiry", () => {
    const [grant] = discordBilling.grantsFromWebhook(
      event("ENTITLEMENT_UPDATE", { user_id: "u", sku_id: "sku", ends_at: "2999-01-01T00:00:00Z" })
    )
    expect(grant).toMatchObject({ active: true, expiresAt: Date.parse("2999-01-01T00:00:00Z") / 1000 })
  })
  it("ignores PING and events that are not about entitlements", () => {
    expect(discordBilling.grantsFromWebhook({ version: 1, type: 0 })).toEqual([])
    expect(
      discordBilling.grantsFromWebhook(event("APPLICATION_AUTHORIZED", { guild_id: "g", sku_id: "x" }))
    ).toEqual([])
  })
})

describe("discord webhook signature", () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519")
  const hex = publicKey.export({ format: "der", type: "spki" }).subarray(-32).toString("hex")
  const verify = discordSignatureVerifier(hex)
  const sign = (timestamp: string, body: string) =>
    crypto.sign(null, Buffer.from(timestamp + body), privateKey).toString("hex")

  it("accepts Discord's signature over timestamp + body", () => {
    const body = '{"type":0}'
    const headers = { "x-signature-ed25519": sign("123", body), "x-signature-timestamp": "123" }
    expect(verify({ headers, rawBody: body })).toBe(true)
  })
  it("rejects a changed body, a changed timestamp and missing headers", () => {
    const body = '{"type":0}'
    const sig = sign("123", body)
    expect(verify({ headers: { "x-signature-ed25519": sig, "x-signature-timestamp": "123" }, rawBody: '{"type":1}' })).toBe(false)
    expect(verify({ headers: { "x-signature-ed25519": sig, "x-signature-timestamp": "124" }, rawBody: body })).toBe(false)
    expect(verify({ headers: {}, rawBody: body })).toBe(false)
    expect(verify({ headers: { "x-signature-ed25519": "zz", "x-signature-timestamp": "123" }, rawBody: body })).toBe(false)
  })
  it("refuses a public key that is not 64 hex characters", () => {
    expect(() => discordSignatureVerifier("abc")).toThrow()
  })
})

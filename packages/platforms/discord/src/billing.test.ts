import { describe, expect, it } from "vitest"
import { discordBilling } from "./billing.js"

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
})

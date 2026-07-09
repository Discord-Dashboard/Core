import { describe, it, expect } from "vitest"
import { createEntitlements, type Grant, type GrantStore } from "./entitlements.js"
import {
  grantFromStripeSubscription,
  grantFromDiscordEntitlement,
} from "./webhooks.js"

function store(grants: Grant[]): GrantStore {
  return {
    async find(subject, feature) {
      return grants.filter(
        (g) => g.subjectId === subject.id && g.feature === feature
      )
    },
  }
}

describe("entitlements", () => {
  it("grants access when an active grant exists", async () => {
    const ent = createEntitlements(
      store([{ subjectType: "guild", subjectId: "g", feature: "pro", source: "stripe", status: "active" }])
    )
    expect(await ent.has({ type: "guild", id: "g" }, "pro")).toBe(true)
  })
  it("does not let a user grant satisfy a guild check with the same id", async () => {
    // A user and a guild can share the same snowflake id.
    const ent = createEntitlements(
      store([{ subjectType: "user", subjectId: "123", feature: "pro", source: "stripe", status: "active" }])
    )
    expect(await ent.has({ type: "user", id: "123" }, "pro")).toBe(true)
    expect(await ent.has({ type: "guild", id: "123" }, "pro")).toBe(false)
  })
  it("denies access when the grant is expired", async () => {
    const ent = createEntitlements(
      store([
        {
          subjectType: "guild",
          subjectId: "g",
          feature: "pro",
          source: "stripe",
          status: "active",
          expiresAt: 1,
        },
      ])
    )
    expect(await ent.has({ type: "guild", id: "g" }, "pro")).toBe(false)
  })
})

describe("webhook grant mappers", () => {
  it("maps an active stripe subscription", () => {
    const g = grantFromStripeSubscription({
      id: "sub_1",
      status: "active",
      metadata: { subjectType: "guild", subjectId: "g", feature: "pro" },
    })
    expect(g.source).toBe("stripe")
    expect(g.status).toBe("active")
  })
  it("maps a deleted discord entitlement to canceled", () => {
    const g = grantFromDiscordEntitlement({ guild_id: "g", sku_id: "sku", deleted: true })
    expect(g.status).toBe("canceled")
    expect(g.feature).toBe("sku")
  })
})

import { describe as dW, it as iW, expect as eW } from "vitest"
import { grantFromStripeSubscription as gS } from "./webhooks.js"

dW("stripe grant robustness", () => {
  iW("does not throw when metadata is missing", () => {
    const g = gS({ id: "sub_1", status: "active" })
    eW(g.source).toBe("stripe")
    eW(g.subjectId).toBe("")
    eW(g.status).toBe("active")
  })
})

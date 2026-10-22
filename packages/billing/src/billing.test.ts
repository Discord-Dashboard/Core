import { describe, it, expect } from "vitest"
import { SubjectType } from "@asctane-dashboard/core"
import {
  createEntitlements,
  GrantSource,
  GrantStatus,
  type Grant,
  type GrantStore,
} from "./entitlements.js"
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
      store([{ subjectType: "space", subjectId: "g", feature: "pro", source: GrantSource.Stripe, status: GrantStatus.Active }])
    )
    expect(await ent.has({ type: SubjectType.Space, id: "g" }, "pro")).toBe(true)
  })
  it("does not let a user grant satisfy a space check with the same id", async () => {
    // A user and a space can share the same snowflake id.
    const ent = createEntitlements(
      store([{ subjectType: "user", subjectId: "123", feature: "pro", source: GrantSource.Stripe, status: GrantStatus.Active }])
    )
    expect(await ent.has({ type: SubjectType.User, id: "123" }, "pro")).toBe(true)
    expect(await ent.has({ type: SubjectType.Space, id: "123" }, "pro")).toBe(false)
  })
  it("denies access when the grant is expired", async () => {
    const ent = createEntitlements(
      store([
        {
          subjectType: "space",
          subjectId: "g",
          feature: "pro",
          source: GrantSource.Stripe,
          status: GrantStatus.Active,
          expiresAt: 1,
        },
      ])
    )
    expect(await ent.has({ type: SubjectType.Space, id: "g" }, "pro")).toBe(false)
  })
})

describe("webhook grant mappers", () => {
  it("maps an active stripe subscription", () => {
    const g = grantFromStripeSubscription({
      id: "sub_1",
      status: "active",
      metadata: { subjectType: "space", subjectId: "g", feature: "pro" },
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

dW("stripe legacy subject type", () => {
  iW("reads an older guild subscription as a space", () => {
    const g = gS({
      id: "sub_2",
      status: "active",
      metadata: { subjectType: "guild", subjectId: "g", feature: "pro" },
    })
    eW(g.subjectType).toBe("space")
  })
})

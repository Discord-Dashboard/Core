import { describe, it, expect } from "vitest"
import { EventSourcedStore } from "./event-store.js"
import { MemoryStore } from "./inprocess.js"

describe("EventSourcedStore", () => {
  it("records every write as an event", async () => {
    let t = 0
    const store = new EventSourcedStore(new MemoryStore(), () => ++t)
    await store.set("a", 1)
    await store.set("a", 2)
    await store.set("b", 9)
    expect(store.history("a")).toHaveLength(2)
    expect(store.history()).toHaveLength(3)
    expect(await store.get("a")).toBe(2)
  })
  it("rolls back to the previous value", async () => {
    const store = new EventSourcedStore()
    await store.set("a", "first")
    await store.set("a", "second")
    expect(await store.get("a")).toBe("second")
    const ok = await store.rollback("a")
    expect(ok).toBe(true)
    expect(await store.get("a")).toBe("first")
  })
  it("cannot roll back without prior history", async () => {
    const store = new EventSourcedStore()
    await store.set("a", 1)
    expect(await store.rollback("a")).toBe(false)
  })
})

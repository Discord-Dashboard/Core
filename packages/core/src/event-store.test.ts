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
  it("walks all the way back through history on repeated rollbacks", async () => {
    const store = new EventSourcedStore()
    await store.set("a", "v0")
    await store.set("a", "v1")
    await store.set("a", "v2")
    expect(await store.rollback("a")).toBe(true)
    expect(await store.get("a")).toBe("v1")
    expect(await store.rollback("a")).toBe(true)
    expect(await store.get("a")).toBe("v0")
    // No further to go.
    expect(await store.rollback("a")).toBe(false)
    // A new write returns to the latest and history is intact.
    await store.set("a", "v3")
    expect(await store.get("a")).toBe("v3")
    expect(store.history("a")).toHaveLength(4)
  })
})

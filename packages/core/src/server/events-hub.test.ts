import { describe, it, expect } from "vitest"
import { EventHub, wireEvents, type HubEvent } from "./events-hub.js"

describe("EventHub", () => {
  it("delivers events to subscribers of the matching guild", () => {
    const hub = new EventHub()
    const got: HubEvent[] = []
    hub.subscribe((e) => got.push(e), "g1")
    hub.publish({ botId: "b", method: "setting.changed", params: { guildId: "g1" } })
    hub.publish({ botId: "b", method: "setting.changed", params: { guildId: "g2" } })
    expect(got).toHaveLength(1)
    expect((got[0]!.params as { guildId: string }).guildId).toBe("g1")
  })
  it("delivers all events to a guild agnostic subscriber", () => {
    const hub = new EventHub()
    let count = 0
    hub.subscribe(() => count++)
    hub.publish({ botId: "b", method: "setting.changed", params: { guildId: "g1" } })
    hub.publish({ botId: "b", method: "setting.changed", params: { guildId: "g2" } })
    expect(count).toBe(2)
  })
  it("stops delivering after unsubscribe", () => {
    const hub = new EventHub()
    let count = 0
    const off = hub.subscribe(() => count++)
    off()
    hub.publish({ botId: "b", method: "setting.changed", params: {} })
    expect(count).toBe(0)
  })
})

describe("wireEvents", () => {
  it("forwards setting.changed from the gateway to the hub", () => {
    let handler: (e: HubEvent) => void = () => {}
    const fakeGateway = {
      onEvent: (fn: (e: HubEvent) => void) => {
        handler = fn
      },
    }
    const hub = new EventHub()
    const got: HubEvent[] = []
    hub.subscribe((e) => got.push(e))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wireEvents(fakeGateway as any, hub)
    handler({ botId: "b", method: "setting.changed", params: { guildId: "g" } })
    handler({ botId: "b", method: "stats.push", params: {} })
    expect(got).toHaveLength(1)
  })
})

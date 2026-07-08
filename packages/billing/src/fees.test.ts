import { describe, it, expect } from "vitest"
import { computeApplicationFee, connectedAccountShare } from "./fees.js"

describe("application fee", () => {
  it("takes the platform percentage and rounds", () => {
    expect(computeApplicationFee(1000, 10)).toBe(100)
    expect(computeApplicationFee(999, 10)).toBe(100)
    expect(computeApplicationFee(0, 10)).toBe(0)
  })
  it("leaves the rest for the connected account", () => {
    expect(connectedAccountShare(1000, 10)).toBe(900)
  })
  it("rejects invalid input", () => {
    expect(() => computeApplicationFee(-1, 10)).toThrow()
    expect(() => computeApplicationFee(1000, 150)).toThrow()
  })
})

import { describe, it, expect } from "vitest"
import { ProtocolErrorCode } from "./errors.js"
import { PROTOCOL_VERSION } from "./version.js"

describe("protocol", () => {
  it("defines domain error codes", () => {
    expect(ProtocolErrorCode.Unauthorized).toBe(4401)
    expect(ProtocolErrorCode.RateLimited).toBe(4429)
  })
  it("exposes a semver protocol version", () => {
    expect(PROTOCOL_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})

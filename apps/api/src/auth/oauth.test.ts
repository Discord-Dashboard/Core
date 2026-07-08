import { describe, it, expect } from "vitest"
import { createPkce, buildAuthorizeUrl } from "./oauth.js"

describe("oauth helpers", () => {
  it("creates a pkce pair where challenge differs from verifier", () => {
    const { verifier, challenge } = createPkce()
    expect(verifier.length).toBeGreaterThan(20)
    expect(challenge.length).toBeGreaterThan(20)
    expect(challenge).not.toBe(verifier)
  })
  it("builds an authorize url with pkce and state", () => {
    const url = buildAuthorizeUrl({
      clientId: "cid",
      redirectUri: "http://x/cb",
      state: "st",
      challenge: "ch",
      scopes: ["identify", "guilds"],
    })
    expect(url).toContain("client_id=cid")
    expect(url).toContain("code_challenge=ch")
    expect(url).toContain("code_challenge_method=S256")
    expect(url).toContain("state=st")
  })
})

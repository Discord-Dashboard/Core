import { afterEach, describe, expect, it, vi } from "vitest"
import { buildAuthorizeUrl, fetchManageableGuilds } from "./oauth.js"
import { discord } from "./index.js"

describe("discord oauth", () => {
  afterEach(() => vi.unstubAllGlobals())

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

  it("only lists guilds the user owns or has Manage Server in", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify([
            { id: "g1", name: "Owned", icon: null, owner: true, permissions: "0" },
            { id: "g2", name: "Manager", icon: null, permissions: "32" },
            { id: "g3", name: "Member", icon: null, permissions: "0" },
            { id: "g4", name: "Broken", icon: null, permissions: "not a number" },
          ])
        )
      )
    )
    const guilds = await fetchManageableGuilds("tok")
    expect(guilds.map((g) => g.id)).toEqual(["g1", "g2"])
  })

  it("logs in through the platform interface", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        const u = String(url)
        if (u.endsWith("/oauth2/token")) {
          const body = new URLSearchParams(String(init?.body))
          expect(body.get("code_verifier")).toBe("ver")
          expect(body.get("redirect_uri")).toBe("http://x/cb")
          return new Response(JSON.stringify({ access_token: "tok" }))
        }
        if (u.endsWith("/users/@me/guilds")) {
          return new Response(JSON.stringify([{ id: "g1", name: "G", icon: null, owner: true }]))
        }
        return new Response(JSON.stringify({ id: "u1", username: "bob", avatar: null }))
      })
    )
    const platform = discord({ clientId: "cid", clientSecret: "sec", redirectUri: "http://x/cb" })
    const start = await platform.auth.start({ state: "st", codeChallenge: "ch" })
    expect(start.kind).toBe("redirect")
    const result = await platform.auth.finish({ codeVerifier: "ver", query: { code: "c" } })
    expect(result.user).toEqual({ id: "u1", username: "bob", avatar: null })
    expect(result.spaces).toEqual([{ id: "g1", name: "G", icon: null }])
  })

  it("refuses a callback without a code and warns about missing credentials", async () => {
    const platform = discord({ clientId: "", clientSecret: "", redirectUri: "http://x/cb" })
    await expect(platform.auth.finish({ codeVerifier: "v", query: {} })).rejects.toThrow()
    expect(platform.warnings?.()).toEqual([
      "DISCORD_CLIENT_ID is not set",
      "DISCORD_CLIENT_SECRET is not set",
    ])
  })
})

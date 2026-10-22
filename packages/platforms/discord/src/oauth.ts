import type { SpaceSummary } from "@discord-dashboard/core"

const API = "https://discord.com/api"

// Manage Server. Owners have every permission, so they pass too.
const MANAGE_GUILD = 0x20n

export function buildAuthorizeUrl(input: {
  clientId: string
  redirectUri: string
  state: string
  challenge: string
  scopes: string[]
}) {
  const params = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: input.scopes.join(" "),
    state: input.state,
    code_challenge: input.challenge,
    code_challenge_method: "S256",
  })
  return `https://discord.com/oauth2/authorize?${params.toString()}`
}

export async function exchangeCode(input: {
  clientId: string
  clientSecret: string
  redirectUri: string
  code: string
  verifier: string
}) {
  const body = new URLSearchParams({
    client_id: input.clientId,
    client_secret: input.clientSecret,
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: input.redirectUri,
    code_verifier: input.verifier,
  })
  const res = await fetch(`${API}/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!res.ok) throw new Error("token exchange failed")
  return (await res.json()) as { access_token: string }
}

export async function fetchUser(accessToken: string) {
  const res = await fetch(`${API}/users/@me`, {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error("user fetch failed")
  return (await res.json()) as { id: string; username: string; avatar: string | null }
}

interface DiscordGuild {
  id: string
  name: string
  icon: string | null
  owner?: boolean
  permissions?: string
}

function hasManageGuild(perms?: string) {
  try {
    return (BigInt(perms ?? "0") & MANAGE_GUILD) !== 0n
  } catch {
    return false
  }
}

// The guilds a user may manage: ones they own or have Manage Server in.
export async function fetchManageableGuilds(accessToken: string): Promise<SpaceSummary[]> {
  const res = await fetch(`${API}/users/@me/guilds`, {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error("guild fetch failed")
  const guilds = (await res.json()) as DiscordGuild[]
  return guilds
    .filter((g) => g.owner || hasManageGuild(g.permissions))
    .map((g) => ({ id: g.id, name: g.name, icon: g.icon }))
}

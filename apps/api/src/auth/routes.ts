import type { FastifyInstance } from "fastify"
import type { ApiConfig } from "../config.js"
import { SESSION_COOKIE, type SessionStore } from "./session.js"
import { buildAuthorizeUrl, createPkce, createState } from "./oauth.js"

async function exchangeCode(config: ApiConfig, code: string, verifier: string) {
  const body = new URLSearchParams({
    client_id: config.discord.clientId,
    client_secret: config.discord.clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: config.discord.redirectUri,
    code_verifier: verifier,
  })
  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!res.ok) throw new Error("token exchange failed")
  return (await res.json()) as { access_token: string }
}

async function fetchUser(accessToken: string) {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error("user fetch failed")
  return (await res.json()) as { id: string; username: string; avatar: string | null }
}

const MANAGE_GUILD = 0x20n

interface DiscordGuild {
  id: string
  name: string
  icon: string | null
  owner?: boolean
  permissions?: string
}

// The guilds a user may manage: ones they own or have Manage Server in.
async function fetchManageableGuilds(accessToken: string) {
  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error("guild fetch failed")
  const guilds = (await res.json()) as DiscordGuild[]
  const hasManage = (perms?: string) => {
    try {
      return (BigInt(perms ?? "0") & MANAGE_GUILD) !== 0n
    } catch {
      return false
    }
  }
  return guilds
    .filter((g) => g.owner || hasManage(g.permissions))
    .map((g) => ({ id: g.id, name: g.name, icon: g.icon }))
}

export async function registerAuthRoutes(
  app: FastifyInstance,
  config: ApiConfig,
  sessions: SessionStore
) {
  app.get("/auth/discord", async (req, reply) => {
    const sid = req.cookies[SESSION_COOKIE] ?? sessions.create()
    const { verifier, challenge } = createPkce()
    const state = createState()
    sessions.set(sid, { ...(sessions.get(sid) ?? {}), pkceVerifier: verifier, state })
    reply.setCookie(SESSION_COOKIE, sid, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    })
    return reply.redirect(
      buildAuthorizeUrl({
        clientId: config.discord.clientId,
        redirectUri: config.discord.redirectUri,
        state,
        challenge,
        scopes: ["identify", "guilds"],
      })
    )
  })

  app.get("/auth/callback", async (req, reply) => {
    const { code, state } = req.query as { code?: string; state?: string }
    const sid = req.cookies[SESSION_COOKIE]
    const session = sessions.get(sid)
    // Every piece must be present and the state must match what we issued. A
    // logged in session has no state, so a missing state can never slip through.
    if (
      !session ||
      !code ||
      !state ||
      !session.state ||
      !session.pkceVerifier ||
      session.state !== state
    ) {
      return reply.code(400).send({ error: "invalid state" })
    }
    const verifier = session.pkceVerifier
    // Single use: burn the state and verifier so the callback cannot be replayed.
    sessions.set(sid!, { ...session, state: undefined, pkceVerifier: undefined })
    const token = await exchangeCode(config, code, verifier)
    const user = await fetchUser(token.access_token)
    const guilds = await fetchManageableGuilds(token.access_token)

    // Rotate the session id on login to prevent session fixation.
    sessions.destroy(sid)
    const newSid = sessions.create()
    sessions.set(newSid, {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      guilds,
    })
    reply.setCookie(SESSION_COOKIE, newSid, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    })
    return reply.redirect(config.allowedOrigins[0] ?? "/")
  })

  app.get("/api/guilds", async (req, reply) => {
    const session = sessions.get(req.cookies[SESSION_COOKIE])
    if (!session?.userId) return reply.code(401).send({ error: "unauthorized" })
    return { guilds: session.guilds ?? [] }
  })

  // Logout is a state change, so it is POST and covered by the origin check. A
  // GET would let a third party page force a logout via a top level navigation.
  app.post("/auth/logout", async (req, reply) => {
    sessions.destroy(req.cookies[SESSION_COOKIE])
    reply.clearCookie(SESSION_COOKIE, { path: "/" })
    return { ok: true }
  })

  app.get("/auth/me", async (req, reply) => {
    const session = sessions.get(req.cookies[SESSION_COOKIE])
    if (!session?.userId) return reply.code(401).send({ error: "unauthorized" })
    return { id: session.userId, username: session.username, avatar: session.avatar }
  })
}

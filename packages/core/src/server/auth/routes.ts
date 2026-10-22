import type { FastifyInstance } from "fastify"
import { createPlatformRegistry } from "../../base.js"
import type { ApiConfig } from "../config.js"
import { SESSION_COOKIE, type SessionStore } from "./session.js"
import { createPkce, createState } from "./oauth.js"

export async function registerAuthRoutes(
  app: FastifyInstance,
  config: ApiConfig,
  sessions: SessionStore
) {
  const platforms = createPlatformRegistry(config.platforms)

  // Starts a login with one platform: /api/auth/discord for Discord.
  app.get("/api/auth/:platform", async (req, reply) => {
    const platform = platforms.get((req.params as { platform: string }).platform)
    if (!platform) return reply.code(404).send({ error: "unknown platform" })
    const sid = req.cookies[SESSION_COOKIE] ?? sessions.create()
    const { verifier, challenge } = createPkce()
    const state = createState()
    sessions.set(sid, {
      ...(sessions.get(sid) ?? {}),
      pkceVerifier: verifier,
      state,
      authPlatform: platform.id,
    })
    reply.setCookie(SESSION_COOKIE, sid, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    })
    const start = await platform.auth.start({ state, codeChallenge: challenge })
    // A widget login (Telegram) is rendered by the web app, not redirected to.
    if (start.kind === "widget") return { widget: start.config }
    return reply.redirect(start.url)
  })

  app.get("/api/auth/callback", async (req, reply) => {
    const query = req.query as Record<string, string | undefined>
    const { code, state } = query
    const sid = req.cookies[SESSION_COOKIE]
    const session = sessions.get(sid)
    const platform = platforms.get(session?.authPlatform ?? "")
    // Every piece must be present and the state must match what we issued. A
    // logged in session has no state, so a missing state can never slip through.
    if (
      !session ||
      !code ||
      !state ||
      !session.state ||
      !session.pkceVerifier ||
      !platform ||
      session.state !== state
    ) {
      return reply.code(400).send({ error: "invalid state" })
    }
    const verifier = session.pkceVerifier
    // Single use: burn the state and verifier so the callback cannot be replayed.
    sessions.set(sid!, {
      ...session,
      state: undefined,
      pkceVerifier: undefined,
      authPlatform: undefined,
    })
    const { user, spaces } = await platform.auth.finish({ codeVerifier: verifier, query })

    // Rotate the session id on login to prevent session fixation.
    sessions.destroy(sid)
    const newSid = sessions.create()
    sessions.set(newSid, {
      platform: platform.id,
      userId: user.id,
      username: user.username,
      avatar: user.avatar ?? null,
      guilds: spaces,
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
  app.post("/api/auth/logout", async (req, reply) => {
    sessions.destroy(req.cookies[SESSION_COOKIE])
    reply.clearCookie(SESSION_COOKIE, { path: "/" })
    return { ok: true }
  })

  app.get("/api/auth/me", async (req, reply) => {
    const session = sessions.get(req.cookies[SESSION_COOKIE])
    if (!session?.userId) return reply.code(401).send({ error: "unauthorized" })
    return { id: session.userId, username: session.username, avatar: session.avatar }
  })
}

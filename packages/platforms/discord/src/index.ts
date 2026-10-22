import { definePlatform, type Platform } from "@asctane-dashboard/core"
import {
  buildAuthorizeUrl,
  exchangeCode,
  fetchManageableGuilds,
  fetchUser,
} from "./oauth.js"
import { discordSourceFromClient } from "./source.js"

export { discordSourceFromClient } from "./source.js"
export { buildAuthorizeUrl } from "./oauth.js"

export interface DiscordOptions {
  clientId: string
  clientSecret: string
  // Must match a redirect registered on the Discord application.
  redirectUri: string
  // OAuth scopes. identify and guilds are what login and the server list need.
  scopes?: string[]
}

const DEFAULT_SCOPES = ["identify", "guilds"]

// Discord for core: OAuth login, the servers a user may manage, and live
// channels and roles from a discord.js client in lite mode.
export function discord(options: DiscordOptions): Platform {
  return definePlatform({
    id: "discord",
    name: "Discord",
    resources: ["channel", "role"],
    auth: {
      start: ({ state, codeChallenge }) => ({
        kind: "redirect",
        url: buildAuthorizeUrl({
          clientId: options.clientId,
          redirectUri: options.redirectUri,
          state,
          challenge: codeChallenge,
          scopes: options.scopes ?? DEFAULT_SCOPES,
        }),
      }),
      async finish({ codeVerifier, query }) {
        if (!query.code) throw new Error("missing authorization code")
        const token = await exchangeCode({
          clientId: options.clientId,
          clientSecret: options.clientSecret,
          redirectUri: options.redirectUri,
          code: query.code,
          verifier: codeVerifier,
        })
        const user = await fetchUser(token.access_token)
        const spaces = await fetchManageableGuilds(token.access_token)
        return {
          user: { id: user.id, username: user.username, avatar: user.avatar },
          spaces,
        }
      },
    },
    source: discordSourceFromClient,
    warnings: () => {
      const out: string[] = []
      if (!options.clientId) out.push("DISCORD_CLIENT_ID is not set")
      if (!options.clientSecret) out.push("DISCORD_CLIENT_SECRET is not set")
      return out
    },
  })
}

// Reads the options from DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET and
// DISCORD_REDIRECT_URI, for a standalone server.
export function discordFromEnv(env: NodeJS.ProcessEnv = process.env): Platform {
  return discord({
    clientId: env.DISCORD_CLIENT_ID ?? "",
    clientSecret: env.DISCORD_CLIENT_SECRET ?? "",
    redirectUri: env.DISCORD_REDIRECT_URI ?? "http://localhost:3001/api/auth/callback",
  })
}

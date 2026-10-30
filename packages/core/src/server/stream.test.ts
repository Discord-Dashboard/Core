import { describe, it, expect } from "vitest"
import http from "node:http"
import type { AddressInfo } from "node:net"
import { buildServer } from "./server.js"
import type { ApiConfig } from "./config.js"
import { SessionStore, SESSION_COOKIE } from "./auth/session.js"
import { InProcessAdapter, MemoryStore } from "../base.js"
import { defineSettings, f } from "@acstane/schema"
import { discord } from "@acstane/platform-discord"

const config: ApiConfig = {
  port: 0,
  cookieSecret: "test-secret-at-least-32-chars-long-000",
  allowedOrigins: ["http://localhost:3000"],
  platforms: [discord({ clientId: "c", clientSecret: "s", redirectUri: "http://x/cb" })],
}
const def = defineSettings((s) => ({
  general: s.category({ name: "General", options: { prefix: f.text({ default: "!" }) } }),
}))

describe("live stream", () => {
  it("sends its headers and a first comment as soon as it opens", async () => {
    const sessions = new SessionStore({ sweepMs: 0 })
    const sid = sessions.create()
    sessions.set(sid, { userId: "u1", platform: "discord", spaces: [{ id: "g" }] })
    const app = await buildServer(config, {
      def,
      adapter: new InProcessAdapter(def, new MemoryStore()),
      sessions,
    })
    await app.listen({ port: 0, host: "127.0.0.1" })
    const { port } = app.server.address() as AddressInfo
    try {
      // Without the first bytes a browser's EventSource never reports "open",
      // which showed as "Live sync off".
      const first = await new Promise<{ type?: string; chunk: string }>((resolve, reject) => {
        const req = http.get(
          {
            port,
            host: "127.0.0.1",
            path: "/api/spaces/discord/g/stream",
            headers: { cookie: `${SESSION_COOKIE}=${sid}` },
          },
          (res) => {
            res.once("data", (chunk: Buffer) => {
              resolve({ type: res.headers["content-type"], chunk: chunk.toString() })
              req.destroy()
            })
          }
        )
        req.on("error", reject)
      })
      expect(first.type).toBe("text/event-stream")
      expect(first.chunk.startsWith(":")).toBe(true)
    } finally {
      await app.close()
    }
  })
})

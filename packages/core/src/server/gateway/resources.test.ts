import { describe, it, expect } from "vitest"
import { createServer } from "node:http"
import { startGateway } from "./gateway.js"
import { RemoteAdapter } from "./remote-adapter.js"
import { Adapter, defineSettings } from "@acstane/sdk-js"

async function waitFor(check: () => boolean, ms = 4000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (check()) return
    await new Promise((r) => setTimeout(r, 25))
  }
  throw new Error("timeout")
}

async function connect(setup: (bot: Adapter) => Adapter) {
  const server = createServer()
  const botId = "res-bot"
  const secret = "res-secret"
  const gateway = startGateway(server, async (id) => (id === botId ? secret : null))
  await new Promise<void>((r) => server.listen(0, r))
  const port = (server.address() as { port: number }).port
  const bot = setup(
    new Adapter({ botId, secret, gateway: `ws://127.0.0.1:${port}/gateway` }).settings(
      defineSettings(() => ({}))
    )
  )
  bot.connect()
  await waitFor(() => gateway.sessions.has(botId))
  const remote = new RemoteAdapter(gateway, botId, { platform: "discord" })
  const close = async () => {
    bot.disconnect()
    gateway.close()
    server.closeAllConnections?.()
    await new Promise<void>((r) => server.close(() => r()))
  }
  return { remote, close }
}

describe("picker lookups over the gateway", () => {
  it("lists channels and roles through onResources", async () => {
    const seen: unknown[] = []
    const { remote, close } = await connect((bot) =>
      bot.onResources((spaceId, kind, filter, platform) => {
        seen.push({ spaceId, kind, filter, platform })
        return [{ label: `#${kind}`, value: "1" }]
      })
    )
    expect(await remote.getChannels("g1", { types: ["text"] })).toEqual([
      { label: "#channel", value: "1" },
    ])
    expect(await remote.getRoles("g1")).toEqual([{ label: "#role", value: "1" }])
    expect(seen[0]).toEqual({
      spaceId: "g1",
      kind: "channel",
      filter: { types: ["text"] },
      platform: "discord",
    })
    await close()
  })

  it("answers member permissions through onPermissions", async () => {
    const { remote, close } = await connect((bot) =>
      bot.onPermissions((_space, userId) => (userId === "u1" ? ["MANAGE_GUILD"] : []))
    )
    expect(await remote.getMemberPermissions("g1", "u1")).toEqual(["MANAGE_GUILD"])
    await close()
  })

  it("answers empty lists without handlers", async () => {
    const { remote, close } = await connect((bot) => bot)
    expect(await remote.getChannels("g1")).toEqual([])
    expect(await remote.getMemberPermissions("g1", "u1")).toEqual([])
    await close()
  })
})

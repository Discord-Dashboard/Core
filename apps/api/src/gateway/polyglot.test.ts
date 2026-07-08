import { describe, it, expect } from "vitest"
import { createServer } from "node:http"
import { spawn, execSync } from "node:child_process"
import path from "node:path"
import { startGateway } from "./gateway.js"

function pythonReady(): boolean {
  try {
    execSync("python3 -c 'import websockets'", { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

async function waitFor(check: () => boolean, ms = 9000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (check()) return
    await new Promise((r) => setTimeout(r, 50))
  }
  throw new Error("timeout waiting for python bot")
}

describe("polyglot gateway", () => {
  it.skipIf(!pythonReady())(
    "a python bot connects and answers settings.describe",
    async () => {
      const server = createServer()
      const botId = "py-bot"
      const secret = "py-secret"
      const gateway = startGateway(server, async (id) =>
        id === botId ? secret : null
      )
      await new Promise<void>((r) => server.listen(0, r))
      const port = (server.address() as { port: number }).port
      const script = path.resolve(
        process.cwd(),
        "packages/sdk-py/tests/_e2e_bot.py"
      )
      const proc = spawn("python3", [script], {
        env: {
          ...process.env,
          GATEWAY: `ws://127.0.0.1:${port}/gateway`,
          BOT_ID: botId,
          SECRET: secret,
        },
        stdio: "ignore",
      })

      try {
        await waitFor(() => gateway.sessions.has(botId))
        const schema = (await gateway.call(botId, "settings.describe")) as {
          categories: { id: string }[]
        }
        expect(schema.categories[0]?.id).toBe("general")
      } finally {
        proc.kill()
        gateway.close()
        server.closeAllConnections?.()
        await new Promise<void>((r) => server.close(() => r()))
      }
    },
    20000
  )
})

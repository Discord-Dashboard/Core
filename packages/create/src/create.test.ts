import { describe, it, expect } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { scaffold } from "./index.js"

describe("scaffolder", () => {
  it("creates a starter project without plaintext secrets", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dd-"))
    const res = scaffold(dir, { name: "test-bot" })
    expect(res.files).toContain("index.js")
    expect(fs.existsSync(path.join(dir, ".env.example"))).toBe(true)

    const index = fs.readFileSync(path.join(dir, "index.js"), "utf8")
    expect(index).toContain("process.env.BOT_TOKEN")
    expect(index).toContain("process.env.DISCORD_CLIENT_SECRET")
    // no hardcoded token or secret literal
    expect(index).not.toMatch(/token:\s*["'][A-Za-z0-9._-]{10,}/i)

    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"))
    expect(pkg.name).toBe("test-bot")
  })
})

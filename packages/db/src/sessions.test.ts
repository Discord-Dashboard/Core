import { describe, it, expect } from "vitest"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { rmSync } from "node:fs"
import Database from "better-sqlite3"
import { SqliteSessionBackend } from "./sessions.js"

describe("SqliteSessionBackend", () => {
  it("keeps a session across backend instances on the same file", () => {
    const path = join(tmpdir(), `dd-sessions-test-${process.pid}.sqlite`)
    try {
      const a = new SqliteSessionBackend(path)
      a.set("sid-1", { userId: "u1", platform: "discord" }, 5000)
      a.close()
      const b = new SqliteSessionBackend(path)
      expect(b.get("sid-1")).toEqual({
        data: { userId: "u1", platform: "discord" },
        expiresAt: 5000,
      })
      b.close()
    } finally {
      rmSync(path, { force: true })
      rmSync(`${path}-wal`, { force: true })
      rmSync(`${path}-shm`, { force: true })
    }
  })

  it("stores only a hash of the session id", () => {
    const path = join(tmpdir(), `dd-sessions-hash-${process.pid}.sqlite`)
    try {
      const backend = new SqliteSessionBackend(path)
      backend.set("secret-sid", { userId: "u1" }, 5000)
      backend.close()
      const raw = new Database(path)
      const ids = raw.prepare("SELECT id FROM sessions").all() as { id: string }[]
      raw.close()
      expect(ids).toHaveLength(1)
      expect(ids[0]!.id).not.toContain("secret-sid")
    } finally {
      rmSync(path, { force: true })
      rmSync(`${path}-wal`, { force: true })
      rmSync(`${path}-shm`, { force: true })
    }
  })

  it("deletes and sweeps expired sessions", () => {
    const backend = new SqliteSessionBackend(":memory:")
    backend.set("old", { userId: "u1" }, 1000)
    backend.set("new", { userId: "u2" }, 9000)
    backend.set("gone", { userId: "u3" }, 9000)
    backend.delete("gone")
    backend.sweep(5000)
    expect(backend.get("old")).toBeUndefined()
    expect(backend.get("gone")).toBeUndefined()
    expect(backend.get("new")?.data).toEqual({ userId: "u2" })
    backend.close()
  })
})

import { describe, it, expect } from "vitest"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { rmSync } from "node:fs"
import { SqliteKeyValueStore } from "./kv.js"

describe("SqliteKeyValueStore", () => {
  it("stores and reads values as json", () => {
    const store = new SqliteKeyValueStore(":memory:")
    expect(store.get("g:general.prefix")).toBeNull()
    store.set("g:general.prefix", "!")
    store.set("g:general.enabled", true)
    store.set("g:general.list", ["a", "b"])
    expect(store.get("g:general.prefix")).toBe("!")
    expect(store.get("g:general.enabled")).toBe(true)
    expect(store.get("g:general.list")).toEqual(["a", "b"])
    store.close()
  })

  it("overwrites an existing key rather than duplicating it", () => {
    const store = new SqliteKeyValueStore(":memory:")
    store.set("k", 1)
    store.set("k", 2)
    expect(store.get("k")).toBe(2)
    store.close()
  })

  it("persists values across store instances on the same file", () => {
    const path = join(tmpdir(), `dd-kv-test-${process.pid}.sqlite`)
    try {
      const first = new SqliteKeyValueStore(path)
      first.set("g:general.prefix", "!")
      first.close()
      // A brand new store on the same file still sees the value: real durability.
      const second = new SqliteKeyValueStore(path)
      expect(second.get("g:general.prefix")).toBe("!")
      second.close()
    } finally {
      for (const suffix of ["", "-wal", "-shm"]) {
        rmSync(path + suffix, { force: true })
      }
    }
  })
})

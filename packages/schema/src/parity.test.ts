import { describe, it, expect } from "vitest"
import { execSync } from "node:child_process"
import path from "node:path"
import { defineSettings, f } from "./index.js"
import { toWire } from "./wire.js"

function pythonReady(): boolean {
  try {
    execSync("python3 -c 'import websockets'", { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

interface Wire {
  categories: {
    id: string
    name: string
    options: { id: string; type: string; label?: string; enum?: unknown }[]
  }[]
}

// Compare only the meaningful contract fields, ignoring null vs missing.
function norm(w: Wire) {
  return w.categories.map((c) => ({
    id: c.id,
    name: c.name,
    options: c.options.map((o) => ({
      id: o.id,
      type: o.type,
      label: o.label ?? null,
      enum: o.enum ?? null,
    })),
  }))
}

describe("wire parity between js and python sdk", () => {
  it.skipIf(!pythonReady())("produces identical wire for equivalent schemas", () => {
    const jsWire = toWire(
      defineSettings((s) => ({
        general: s.category({
          name: "General",
          options: {
            prefix: f.text({ label: "Prefix" }),
            level: f.select({ options: { off: "Off", high: "High" } }),
          },
        }),
      }))
    ) as unknown as Wire

    const out = execSync("python3 packages/sdk-py/tests/_emit_wire.py", {
      cwd: process.cwd(),
      encoding: "utf8",
    })
    const pyWire = JSON.parse(out) as Wire

    expect(norm(pyWire)).toEqual(norm(jsWire))
  })
})

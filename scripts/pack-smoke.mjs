// Packs every publishable workspace package the way `pnpm publish` would,
// installs the tarballs into an empty project with npm and imports each one.
// This catches what tests against the TypeScript sources cannot: files missing
// from the tarball, workspace deps that are private, and broken dist entries.
// Run after `pnpm build`. Pass `--out <dir>` to keep the tarballs there, for
// installing into a local test project before anything is on npm.
import { execFileSync, execSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

// pnpm and npm are .cmd shims on Windows, which Node only runs through a shell.
// There the command goes in as one quoted string, since passing an argument
// array together with shell: true is deprecated (DEP0190).
const win = process.platform === "win32"
const quote = (a) => (/[\s"&|<>^]/.test(a) ? `"${a.replace(/"/g, '""')}"` : a)
const run = (cmd, args, cwd) => {
  const opts = { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }
  return win
    ? execSync([cmd, ...args].map(quote).join(" "), opts)
    : execFileSync(cmd, args, opts)
}

const workspace = JSON.parse(run("pnpm", ["-r", "ls", "--depth", "-1", "--json"]))
const packages = workspace.filter((p) => !p.private && p.name)
const names = new Set(packages.map((p) => p.name))

const outFlag = process.argv.indexOf("--out")
const out = outFlag === -1 ? undefined : process.argv[outFlag + 1]
if (outFlag !== -1 && !out) throw new Error("--out needs a directory")

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dd-pack-smoke-"))
const packs = out ? path.resolve(out) : path.join(tmp, "packs")
const consumer = path.join(tmp, "consumer")
fs.mkdirSync(packs, { recursive: true })
// Only clear old tarballs, never the directory itself: --out may point anywhere.
for (const f of fs.readdirSync(packs)) {
  if (f.endsWith(".tgz")) fs.rmSync(path.join(packs, f))
}
fs.mkdirSync(consumer)

const failures = []
for (const p of packages) {
  const manifest = JSON.parse(fs.readFileSync(path.join(p.path, "package.json"), "utf8"))
  const deps = { ...manifest.dependencies, ...manifest.peerDependencies }
  for (const [dep, range] of Object.entries(deps)) {
    if (range.startsWith("workspace:") && !names.has(dep)) {
      failures.push(`${p.name} depends on ${dep}, which is private or not in the workspace`)
    }
  }
  run("pnpm", ["pack", "--pack-destination", packs], p.path)
}

fs.writeFileSync(
  path.join(consumer, "package.json"),
  JSON.stringify({ name: "pack-smoke-consumer", private: true, type: "module" })
)
const tarballs = fs
  .readdirSync(packs)
  .filter((f) => f.endsWith(".tgz"))
  .map((f) => path.join(packs, f))
run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error", ...tarballs], consumer)

for (const p of packages) {
  const script = `import(${JSON.stringify(p.name)}).then(
    () => process.exit(0),
    (e) => {
      // A bundler only package may import a stylesheet. Node cannot load it,
      // but reaching it proves the file shipped and the graph resolved.
      if (e.code === "ERR_UNKNOWN_FILE_EXTENSION" && /\\.css/.test(e.message)) process.exit(0)
      console.error(e.message.split("\\n")[0])
      process.exit(1)
    })`
  try {
    execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: consumer,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    console.log(`ok   ${p.name}`)
  } catch (e) {
    failures.push(`${p.name} does not import: ${String(e.stderr).trim()}`)
    console.log(`FAIL ${p.name}`)
  }
}

fs.rmSync(tmp, { recursive: true, force: true })
if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n- ${failures.join("\n- ")}`)
  process.exit(1)
}
console.log(`\nAll ${packages.length} packages pack, install and import.`)
if (out) console.log(`Tarballs kept in ${packs}`)

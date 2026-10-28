// Publishes every tarball in .packs by hand, for a package's first release.
// npm only takes a trust link (pnpm npm:trust) for a package that already
// exists, so new packages go out once from a maintainer's machine, and later
// tags publish from release.yml. Run `pnpm build && pnpm smoke:pack --out .packs`
// first, and log in with `npm login`. A version that is already on npm is
// skipped, so a run that stops halfway can simply be run again. Pass
// `--dry-run` to see the commands without publishing.
import { execFileSync, execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

// pnpm and npm are .cmd shims on Windows, which Node only runs through a shell.
const win = process.platform === "win32"
const quote = (a) => (/[\s"&|<>^]/.test(a) ? `"${a.replace(/"/g, '""')}"` : a)
const run = (cmd, args, inherit = false) => {
  const opts = { encoding: "utf8", stdio: inherit ? "inherit" : ["ignore", "pipe", "ignore"] }
  return win
    ? execSync([cmd, ...args].map(quote).join(" "), opts)
    : execFileSync(cmd, args, opts)
}

const dryRun = process.argv.includes("--dry-run")
const packs = path.resolve(".packs")
if (!fs.existsSync(packs)) throw new Error("No .packs folder. Run pnpm build && pnpm smoke:pack --out .packs first.")

const workspace = JSON.parse(run("pnpm", ["-r", "ls", "--depth", "-1", "--json"]))
const pkgs = workspace.filter((p) => !p.private && p.name)
const versions = new Set(pkgs.map((p) => p.version))
if (versions.size !== 1) throw new Error(`Packages are on different versions: ${[...versions].join(", ")}`)
const [version] = versions
// The same rule as release.yml: a prerelease goes out under its own dist tag.
const prerelease = version.includes("-") ? version.split("-")[1].split(".")[0] : null
const tag = prerelease ?? "latest"

const tarballs = fs.readdirSync(packs).filter((f) => f.endsWith(".tgz"))
if (tarballs.length !== pkgs.length) {
  throw new Error(`.packs holds ${tarballs.length} tarballs for ${pkgs.length} packages. Pack again.`)
}

console.log(`Publishing ${pkgs.length} packages at ${version} under the ${tag} dist tag.`)
const failures = []
for (const p of pkgs) {
  // pnpm names a tarball after the package: @scope/name becomes scope-name.
  const file = `${p.name.replace(/^@/, "").replace("/", "-")}-${version}.tgz`
  if (!tarballs.includes(file)) {
    failures.push(p.name)
    console.log(`MISS ${p.name}: no ${file}`)
    continue
  }
  let published = false
  try {
    published = run("npm", ["view", `${p.name}@${version}`, "version"]).trim() === version
  } catch {
    // E404: the package or this version isn't on npm yet.
  }
  if (published) {
    console.log(`skip ${p.name}@${version} is already on npm`)
    continue
  }
  const args = ["publish", path.join(packs, file), "--access", "public", "--tag", tag]
  if (dryRun) {
    console.log(`npm ${args.join(" ")}`)
    continue
  }
  try {
    run("npm", args, true)
    console.log(`ok   ${p.name}`)
  } catch {
    failures.push(p.name)
    console.log(`FAIL ${p.name}`)
  }
}

if (failures.length) {
  console.error(`\nNot published: ${failures.join(", ")}. Fix the cause and run this again.`)
  process.exit(1)
}
if (!dryRun) console.log(`\nDone. Next: pnpm npm:trust, then push the v${version} tag.`)

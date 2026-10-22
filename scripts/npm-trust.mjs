// Links every publishable workspace package to the release workflow on npm, so
// tags publish through trusted publishing (OIDC) instead of an npm token.
// npm only takes a trust link for a package that already exists, so run this
// once after a package's first publish, from an npm account that can publish
// it. Needs npm 11.15 or later and 2FA on the account. Pass `--dry-run` to see
// the commands without running them.
import { execFileSync, execSync } from "node:child_process"

const REPO = "Discord-Dashboard/Core"
const WORKFLOW = "release.yml"

// pnpm and npm are .cmd shims on Windows, which Node only runs through a shell.
const win = process.platform === "win32"
const quote = (a) => (/[\s"&|<>^]/.test(a) ? `"${a.replace(/"/g, '""')}"` : a)
const run = (cmd, args, inherit = false) => {
  const opts = { encoding: "utf8", stdio: inherit ? "inherit" : ["ignore", "pipe", "inherit"] }
  return win
    ? execSync([cmd, ...args].map(quote).join(" "), opts)
    : execFileSync(cmd, args, opts)
}

const dryRun = process.argv.includes("--dry-run")
const workspace = JSON.parse(run("pnpm", ["-r", "ls", "--depth", "-1", "--json"]))
const names = workspace.filter((p) => !p.private && p.name).map((p) => p.name)

const failures = []
for (const name of names) {
  const args = ["trust", "github", name, "--file", WORKFLOW, "--repo", REPO, "--allow-publish", "--yes"]
  if (dryRun) {
    console.log(`npm ${args.join(" ")}`)
    continue
  }
  try {
    run("npm", args, true)
    console.log(`ok   ${name}`)
  } catch {
    failures.push(name)
    console.log(`FAIL ${name}`)
  }
}

if (failures.length) {
  console.error(`\nNot linked: ${failures.join(", ")}`)
  console.error("A package that already has a trust link must be revoked first (npm trust list, npm trust revoke).")
  process.exit(1)
}
if (!dryRun) console.log(`\nAll ${names.length} packages publish from ${REPO} ${WORKFLOW}.`)

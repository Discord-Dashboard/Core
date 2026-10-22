import fs from "node:fs"
import path from "node:path"

export interface ScaffoldOptions {
  name?: string
}

const STARTER = `import { Client, GatewayIntentBits } from "discord.js"
import { createDashboard, defineSettings, f } from "discord-dashboard"

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const settings = defineSettings((s) => ({
  general: s.category({
    name: "General",
    options: { prefix: f.text({ label: "Prefix", max: 3, default: "!" }) },
  }),
}))

const dash = createDashboard({
  client,
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
  },
  settings,
})

await client.login(process.env.BOT_TOKEN)
await dash.listen(3001)
`

// Unlike the v2 scaffolder, secrets are read from the environment and never
// written into generated source.
export function scaffold(targetDir: string, opts: ScaffoldOptions = {}) {
  // Default to the folder name, made safe for package.json.
  const fromDir = path
    .basename(path.resolve(targetDir))
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[._-]+|-+$/g, "")
  const name = opts.name ?? (fromDir || "my-bot-dashboard")
  fs.mkdirSync(targetDir, { recursive: true })
  const files: Record<string, string> = {
    "package.json":
      JSON.stringify(
        {
          name,
          private: true,
          type: "module",
          // Node loads .env itself (20.6+), so the secrets never need a
          // dotenv dependency or a copy in the shell.
          scripts: { start: "node --env-file=.env index.js" },
          engines: { node: ">=20.6" },
          dependencies: {
            "discord-dashboard": "^3.1.0-alpha.0",
            "discord.js": "^14.26.4",
          },
        },
        null,
        2
      ) + "\n",
    ".env.example":
      "DISCORD_CLIENT_ID=\nDISCORD_CLIENT_SECRET=\nBOT_TOKEN=\nCOOKIE_SECRET=\n",
    ".gitignore": "node_modules/\n.env\n",
    "index.js": STARTER,
  }
  for (const [file, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(targetDir, file), content)
  }
  return { name, files: Object.keys(files) }
}

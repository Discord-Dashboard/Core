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
  const name = opts.name ?? "my-bot-dashboard"
  fs.mkdirSync(targetDir, { recursive: true })
  const files: Record<string, string> = {
    "package.json":
      JSON.stringify(
        {
          name,
          private: true,
          type: "module",
          scripts: { start: "node index.js" },
          dependencies: {
            "discord-dashboard": "^3.0.0-alpha.0",
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

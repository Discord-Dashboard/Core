# @acstane/dashboard

The batteries included way to add a web dashboard to a discord.js bot. One call
sets up Discord login, sessions, the settings API, the web dashboard and an in
process adapter, all on one port. No license server, no external services.

> **Public beta.** v3 is in beta: install it with `@beta`, and expect some
> changes before 3.1.0. Feedback and bug reports are welcome on
> [GitHub issues](https://github.com/Discord-Dashboard/Core/issues) or in the
> [support Discord](https://discord.gg/6Yv5U9V3ux). Looking for v2? It is still
> published as `discord-dashboard`.

## Quick start

You need Node.js 20.6 or later and a Discord application.

1. In the [Discord Developer Portal](https://discord.com/developers/applications),
   create an application. On **OAuth2**, copy the client ID and secret and add
   the redirect `http://localhost:3001/api/auth/discord/callback`. On **Bot**,
   copy the token, then invite the bot to a test server.
2. Scaffold a bot:

   ```bash
   npm init @acstane@beta my-bot
   cd my-bot
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in `DISCORD_CLIENT_ID`,
   `DISCORD_CLIENT_SECRET`, `BOT_TOKEN` and a `COOKIE_SECRET` of 32 characters
   or more.
4. Run `npm start` and open http://localhost:3001.

## Add it to an existing bot

```bash
npm install @acstane/dashboard@beta
```

```js
import { Client, GatewayIntentBits } from "discord.js"
import { createDashboard, defineSettings, f } from "@acstane/dashboard"

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const settings = defineSettings((s) => ({
  general: s.category({
    name: "General",
    options: {
      prefix: f.text({ label: "Prefix", max: 3, default: "!" }),
      logChannel: f.channel({ types: ["text"] }),
      leveling: f.switch({ default: true }),
    },
  }),
}))

const dash = createDashboard({
  client,
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
  },
  settings,
  storage: "sqlite",
})

await client.login(process.env.BOT_TOKEN)
await dash.listen(3001)

// Read a setting anywhere in the bot. Unset values return their default.
const prefix = await dash.get(guildId, "general.prefix")
```

- `storage: "sqlite"` keeps settings in a local file. Leave it out to keep them
  in memory, or pass your own `{ get, set }` store.
- Logins are kept in the same file when `storage` is `"sqlite"`, so restarting
  the bot doesn't log anyone out. Set `sessions: "sqlite"` or `"memory"` to
  choose yourself.
- `web: false` serves only the API, and `web: { root }` serves your own build of
  the web app.
- Billing webhooks are only accepted when they can be verified. Set
  `discord.publicKey` (or `DISCORD_PUBLIC_KEY`) for Discord SKU purchases at
  `/api/webhooks/discord`, and `billing.stripeWebhookSecret` (or
  `STRIPE_WEBHOOK_SECRET`) for Stripe at `/api/webhooks/stripe`. Without them
  those webhooks answer 503.
- In production, set `NODE_ENV=production`, a strong `COOKIE_SECRET` and your
  own `discord.redirectUri`, and put the dashboard behind HTTPS.

## Coming from v2

`@acstane/compat-v2` runs a v2 settings array, `getActualSet` and
`setNew` included:

```js
import { fromV2 } from "@acstane/compat-v2"

const { def, adapter } = fromV2(v2Settings)
const dash = createDashboard({ client, discord, settings: def, adapter })
```

Update your Discord redirect to `/api/auth/discord/callback`, since the path
changed.

## Other languages

For bots that aren't written with discord.js, run `@acstane/core` as a
service and connect the bot with `@acstane/sdk-js` or the Python SDK.

## License

MIT

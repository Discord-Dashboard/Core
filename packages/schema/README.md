# @acstane/schema

Declarative settings for @acstane/dashboard. Define once, validate on the server,
render on the client, and serialize to a language neutral wire format.

```ts
import { defineSettings, f, toWire, fromWire } from "@acstane/schema"

const settings = defineSettings((s) => ({
  general: s.category({
    name: { en: "General", pl: "Ogolne" },
    options: {
      prefix: f.text({ label: "Prefix", max: 3, default: "!" }),
      logChannel: f.ref("channel", { filter: { types: ["text"] } }),
      level: f.select({ options: { off: "Off", high: "High" } }),
    },
  }),
}))

toWire(settings, "pl")   // wire descriptor with polish labels
fromWire(wire)           // rebuild a validating schema from a wire descriptor
```

Field types: text, textarea, number, switch, checkbox, select, multiSelect,
ref, color, list, url, duration.

`f.ref(kind, { multiple?, filter? })` picks something that lives in the space,
such as a channel or a role, from a list the platform fills in live. The filter
is the platform's own: `{ types: ["text"] }` narrows Discord channels.
`f.channel`, `f.channelMulti`, `f.role` and `f.roleMulti` remain as aliases of
`f.ref` during the beta.

Field types only one platform has live in that platform's package. Discord's
`embed` field and its typed channel and role pickers come from
`@acstane/platform-discord`, which exports an extended `f`. Use
`defineField(type, zod, opts)` to make your own, and pass the factories to
`fromWire(wire, fields)` so the dashboard can rebuild them.
Labels and descriptions accept a plain string or a locale map for i18n.

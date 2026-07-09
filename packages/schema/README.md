# @discord-dashboard/schema

Declarative settings for discord-dashboard. Define once, validate on the server,
render on the client, and serialize to a language neutral wire format.

```ts
import { defineSettings, f, toWire, fromWire } from "@discord-dashboard/schema"

const settings = defineSettings((s) => ({
  general: s.category({
    name: { en: "General", pl: "Ogolne" },
    options: {
      prefix: f.text({ label: "Prefix", max: 3, default: "!" }),
      logChannel: f.channel({ types: ["text"] }),
      level: f.select({ options: { off: "Off", high: "High" } }),
    },
  }),
}))

toWire(settings, "pl")   // wire descriptor with polish labels
fromWire(wire)           // rebuild a validating schema from a wire descriptor
```

Field types: text, textarea, number, switch, checkbox, select, multiSelect,
channel, channelMulti, role, roleMulti, color, list, embed, url, duration.
Labels and descriptions accept a plain string or a locale map for i18n.

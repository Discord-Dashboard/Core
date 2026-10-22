import { defineSettings } from "@asctane-dashboard/schema"

export const automod = {
  id: "automod",
  name: "Auto moderation",
  settings: defineSettings((s, f) => ({
    automod: s.category({
      name: "Auto moderation",
      icon: "shield",
      options: {
        enabled: f.switch({ label: "Enable automod", default: false }),
        toxicity: f.select({
          label: "Toxicity filter",
          options: { off: "Off", low: "Low", high: "High" },
          default: "off",
        }),
        blocklist: f.list(f.text(), { label: "Blocked words", max: 200 }),
        logChannel: f.ref("channel", { filter: { types: ["text"] }, label: "Log channel" }),
      },
    }),
  })),
}

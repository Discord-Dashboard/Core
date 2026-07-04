import { defineSettings } from "@discord-dashboard/schema"

// A module declares its own settings schema. The host renders it and calls the
// module handlers. This is the successor to the v2 module example.
export const leveling = {
  id: "leveling",
  name: "Leveling",
  settings: defineSettings((s, f) => ({
    leveling: s.category({
      name: "Leveling",
      icon: "trending-up",
      options: {
        enabled: f.switch({ label: "Enable leveling", default: false }),
        xpPerMessage: f.number({ label: "XP per message", min: 1, max: 100, default: 15 }),
        announceChannel: f.channel({ types: ["text"], label: "Level up channel" }),
        levelRoles: f.roleMulti({ label: "Level roles" }),
      },
    }),
  })),
}

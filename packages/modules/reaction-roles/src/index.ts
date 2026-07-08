import { defineSettings } from "@discord-dashboard/schema"

export const reactionRoles = {
  id: "reaction-roles",
  name: "Reaction roles",
  settings: defineSettings((s, f) => ({
    "reaction-roles": s.category({
      name: "Reaction roles",
      icon: "smile",
      options: {
        enabled: f.switch({ label: "Enable reaction roles", default: false }),
        channel: f.channel({ types: ["text"], label: "Panel channel" }),
        roles: f.roleMulti({ label: "Assignable roles" }),
        unique: f.switch({ label: "Only one role at a time", default: false }),
      },
    }),
  })),
}

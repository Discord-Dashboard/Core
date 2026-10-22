import { defineSettings } from "@asctane-dashboard/schema"

export const reactionRoles = {
  id: "reaction-roles",
  name: "Reaction roles",
  settings: defineSettings((s, f) => ({
    "reaction-roles": s.category({
      name: "Reaction roles",
      icon: "smile",
      options: {
        enabled: f.switch({ label: "Enable reaction roles", default: false }),
        channel: f.ref("channel", { filter: { types: ["text"] }, label: "Panel channel" }),
        roles: f.ref("role", { multiple: true, label: "Assignable roles" }),
        unique: f.switch({ label: "Only one role at a time", default: false }),
      },
    }),
  })),
}

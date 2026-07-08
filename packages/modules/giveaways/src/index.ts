import { defineSettings } from "@discord-dashboard/schema"

export const giveaways = {
  id: "giveaways",
  name: "Giveaways",
  settings: defineSettings((s, f) => ({
    giveaways: s.category({
      name: "Giveaways",
      icon: "gift",
      options: {
        enabled: f.switch({ label: "Enable giveaways", default: false }),
        managerRoles: f.roleMulti({ label: "Manager roles" }),
        defaultChannel: f.channel({ types: ["text"], label: "Default channel" }),
      },
    }),
  })),
}

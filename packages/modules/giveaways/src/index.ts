import { defineSettings } from "@acstane/schema"

export const giveaways = {
  id: "giveaways",
  name: "Giveaways",
  requires: ["channel", "role"],
  settings: defineSettings((s, f) => ({
    giveaways: s.category({
      name: "Giveaways",
      icon: "gift",
      options: {
        enabled: f.switch({ label: "Enable giveaways", default: false }),
        managerRoles: f.ref("role", { multiple: true, label: "Manager roles" }),
        defaultChannel: f.ref("channel", { filter: { types: ["text"] }, label: "Default channel" }),
      },
    }),
  })),
}

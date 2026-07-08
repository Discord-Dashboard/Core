import { defineSettings } from "@discord-dashboard/schema"

export const tickets = {
  id: "tickets",
  name: "Tickets",
  settings: defineSettings((s, f) => ({
    tickets: s.category({
      name: "Tickets",
      icon: "ticket",
      options: {
        enabled: f.switch({ label: "Enable tickets", default: false }),
        category: f.channel({ types: ["category"], label: "Ticket category" }),
        supportRoles: f.roleMulti({ label: "Support roles" }),
        welcome: f.textarea({ label: "Welcome message" }),
      },
    }),
  })),
}

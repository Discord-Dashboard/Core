import { defineSettings } from "@asctane-dashboard/schema"

export const tickets = {
  id: "tickets",
  name: "Tickets",
  settings: defineSettings((s, f) => ({
    tickets: s.category({
      name: "Tickets",
      icon: "ticket",
      options: {
        enabled: f.switch({ label: "Enable tickets", default: false }),
        category: f.ref("channel", { filter: { types: ["category"] }, label: "Ticket category" }),
        supportRoles: f.ref("role", { multiple: true, label: "Support roles" }),
        welcome: f.textarea({ label: "Welcome message" }),
      },
    }),
  })),
}

import { defineSettings } from "@acstane/schema"

export const autoresponder = {
  id: "autoresponder",
  name: "Autoresponder",
  requires: ["channel"],
  settings: defineSettings((s, f) => ({
    autoresponder: s.category({
      name: "Autoresponder",
      icon: "message",
      options: {
        enabled: f.switch({ label: "Enable autoresponder", default: false }),
        triggers: f.list(f.text(), { label: "Trigger phrases", max: 50 }),
        reply: f.textarea({ label: "Reply message" }),
        ignoreChannels: f.ref("channel", { multiple: true, filter: { types: ["text"] }, label: "Ignored channels" }),
      },
    }),
  })),
}

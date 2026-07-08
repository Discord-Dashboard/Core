import { defineSettings } from "@discord-dashboard/schema"

export const autoresponder = {
  id: "autoresponder",
  name: "Autoresponder",
  settings: defineSettings((s, f) => ({
    autoresponder: s.category({
      name: "Autoresponder",
      icon: "message",
      options: {
        enabled: f.switch({ label: "Enable autoresponder", default: false }),
        triggers: f.list(f.text(), { label: "Trigger phrases", max: 50 }),
        reply: f.textarea({ label: "Reply message" }),
        ignoreChannels: f.channelMulti({ types: ["text"], label: "Ignored channels" }),
      },
    }),
  })),
}

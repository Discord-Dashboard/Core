import { defineSettings } from "@discord-dashboard/schema"

export const onboarding = {
  id: "onboarding",
  name: "Onboarding",
  settings: defineSettings((s, f) => ({
    onboarding: s.category({
      name: "Onboarding",
      icon: "wave",
      options: {
        welcomeChannel: f.channel({ types: ["text"], label: "Welcome channel" }),
        welcomeMessage: f.textarea({ label: "Welcome message" }),
        autoRole: f.role({ label: "Auto role on join" }),
        welcomeImage: f.switch({ label: "Welcome image", default: true }),
      },
    }),
  })),
}

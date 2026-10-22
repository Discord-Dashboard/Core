import { defineSettings } from "@asctane-dashboard/schema"

export const onboarding = {
  id: "onboarding",
  name: "Onboarding",
  requires: ["channel", "role"],
  settings: defineSettings((s, f) => ({
    onboarding: s.category({
      name: "Onboarding",
      icon: "wave",
      options: {
        welcomeChannel: f.ref("channel", { filter: { types: ["text"] }, label: "Welcome channel" }),
        welcomeMessage: f.textarea({ label: "Welcome message" }),
        autoRole: f.ref("role", { label: "Auto role on join" }),
        welcomeImage: f.switch({ label: "Welcome image", default: true }),
      },
    }),
  })),
}

export enum SubjectType {
  User = "user",
  // A Discord server, Slack workspace, Telegram group or Twitch channel.
  Space = "space",
  Bot = "bot",
}

export interface EntitlementSubject {
  type: SubjectType
  id: string
}

// One question, many sources. Stripe, Discord SKUs and manual grants all write
// into the same store, and callers ask a single method.
export interface Entitlements {
  has(subject: EntitlementSubject, feature: string): Promise<boolean>
}

export const AllowAll: Entitlements = {
  async has() {
    return true
  },
}

import type { SettingsDef, CategoryDef } from "@discord-dashboard/schema"
import { leveling } from "@discord-dashboard/module-leveling"
import { automod } from "@discord-dashboard/module-automod"
import { tickets } from "@discord-dashboard/module-tickets"
import { giveaways } from "@discord-dashboard/module-giveaways"
import { onboarding } from "@discord-dashboard/module-onboarding"
import { reactionRoles } from "@discord-dashboard/module-reaction-roles"
import { autoresponder } from "@discord-dashboard/module-autoresponder"

// The reference modules that ship with discord-dashboard.
export const modules = [
  leveling,
  automod,
  tickets,
  giveaways,
  onboarding,
  reactionRoles,
  autoresponder,
]

export interface DashboardModule {
  id: string
  name: string
  settings: SettingsDef
}

// Merge several modules' settings into one schema for the dashboard, so a bot
// can pick the features it wants and pass the result straight to
// createDashboard. Category ids must be unique across modules; a collision is a
// configuration error and throws rather than silently dropping settings.
export function composeModules(mods: DashboardModule[]): SettingsDef {
  const categories: Record<string, CategoryDef> = {}
  for (const mod of mods) {
    for (const [id, category] of Object.entries(mod.settings.categories)) {
      if (categories[id]) {
        throw new Error(
          `duplicate category id "${id}" while composing module "${mod.id}"`
        )
      }
      categories[id] = category
    }
  }
  return { categories }
}

import type { SettingsDef, CategoryDef } from "@asctane-dashboard/schema"
import { leveling } from "@asctane-dashboard/module-leveling"
import { automod } from "@asctane-dashboard/module-automod"
import { tickets } from "@asctane-dashboard/module-tickets"
import { giveaways } from "@asctane-dashboard/module-giveaways"
import { onboarding } from "@asctane-dashboard/module-onboarding"
import { reactionRoles } from "@asctane-dashboard/module-reaction-roles"
import { autoresponder } from "@asctane-dashboard/module-autoresponder"

// The reference modules that ship with asctane-dashboard.
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
  // The resource kinds the module picks, such as ["channel", "role"].
  requires?: readonly string[]
  // Only these platforms can run it. Leave it out when the resources are enough.
  platforms?: readonly string[]
}

// The parts of a platform that decide which modules it can run. A core
// Platform fits.
export interface ModuleHost {
  id: string
  resources: readonly string[]
}

// Whether a platform can run a module: it must be allowed and offer every
// resource kind the module picks.
export function canRun(mod: DashboardModule, platform: ModuleHost): boolean {
  if (mod.platforms && !mod.platforms.includes(platform.id)) return false
  return (mod.requires ?? []).every((kind) => platform.resources.includes(kind))
}

// The modules a platform can run, so the dashboard hides the rest.
export function modulesFor<M extends DashboardModule>(
  mods: readonly M[],
  platform: ModuleHost
): M[] {
  return mods.filter((m) => canRun(m, platform))
}

export interface ComposeOptions {
  // Leave out the modules this platform cannot run.
  platform?: ModuleHost
}

// Merge several modules' settings into one schema for the dashboard, so a bot
// can pick the features it wants and pass the result straight to
// createDashboard. Category ids must be unique across modules; a collision is a
// configuration error and throws rather than silently dropping settings.
export function composeModules(
  mods: DashboardModule[],
  options: ComposeOptions = {}
): SettingsDef {
  const categories: Record<string, CategoryDef> = {}
  const usable = options.platform ? modulesFor(mods, options.platform) : mods
  for (const mod of usable) {
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

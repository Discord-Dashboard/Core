import type { Field, Fields } from "./fields.js"
import { f } from "./fields.js"

export interface CategoryConfig {
  name: string
  description?: string
  icon?: string
  entitlement?: string
  options: Record<string, Field>
}

export interface CategoryDef extends CategoryConfig {}

export interface SettingsDef {
  categories: Record<string, CategoryDef>
}

export interface CategoryHelpers {
  category(config: CategoryConfig): CategoryDef
}

const helpers: CategoryHelpers = {
  category(config) {
    return { ...config }
  },
}

export function defineSettings(
  build: (s: CategoryHelpers, fields: Fields) => Record<string, CategoryDef>
): SettingsDef {
  return { categories: build(helpers, f) }
}

// Wire representation of a settings schema. A bot in any language returns this
// shape from settings.describe. The TS schema package builds it from Zod.
export interface WireEnumOption {
  value: string
  label: string
}

export interface WireOption {
  id: string
  type: string
  label?: string
  description?: string
  default?: unknown
  required?: boolean
  enum?: WireEnumOption[]
  min?: number
  max?: number
  entitlement?: string
  ui?: Record<string, unknown>
  // For a list field: the type of each item, so the schema can be rebuilt.
  item?: string
}

export interface WireCategory {
  id: string
  name: string
  description?: string
  icon?: string
  entitlement?: string
  options: WireOption[]
}

export interface SchemaDescriptor {
  version: string
  categories: WireCategory[]
}

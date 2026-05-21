import type { SchemaDescriptor, WireOption } from "@discord-dashboard/protocol"
import type { Field } from "./fields.js"
import type { SettingsDef } from "./define.js"

function optionToWire(id: string, field: Field): WireOption {
  const opts = field.opts as Record<string, unknown>
  const wire: WireOption = { id, type: field.type }
  if (typeof opts.label === "string") wire.label = opts.label
  if (typeof opts.description === "string") wire.description = opts.description
  if (typeof opts.required === "boolean") wire.required = opts.required
  if (typeof opts.entitlement === "string") wire.entitlement = opts.entitlement
  if (opts.default !== undefined) wire.default = opts.default
  if (typeof opts.min === "number") wire.min = opts.min
  if (typeof opts.max === "number") wire.max = opts.max
  if (opts.ui && typeof opts.ui === "object") {
    wire.ui = opts.ui as Record<string, unknown>
  }
  if (opts.options && typeof opts.options === "object") {
    wire.enum = Object.entries(opts.options as Record<string, string>).map(
      ([value, label]) => ({ value, label })
    )
  }
  return wire
}

// Serialize a settings definition to the language neutral wire descriptor.
export function toWire(def: SettingsDef): SchemaDescriptor {
  return {
    version: "1.0",
    categories: Object.entries(def.categories).map(([id, category]) => ({
      id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      entitlement: category.entitlement,
      options: Object.entries(category.options).map(([oid, field]) =>
        optionToWire(oid, field)
      ),
    })),
  }
}

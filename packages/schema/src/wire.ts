import type { SchemaDescriptor, WireOption } from "@discord-dashboard/protocol"
import type { Field } from "./fields.js"
import type { SettingsDef } from "./define.js"

// Resolve a possibly localized value to a string for the requested locale,
// falling back to English and then to any available translation.
function pick(value: unknown, locale?: string): string | undefined {
  if (typeof value === "string") return value
  if (value && typeof value === "object") {
    const map = value as Record<string, string>
    return (locale && map[locale]) ?? map["en"] ?? Object.values(map)[0]
  }
  return undefined
}

function optionToWire(id: string, field: Field, locale?: string): WireOption {
  const opts = field.opts as Record<string, unknown>
  const wire: WireOption = { id, type: field.type }
  const label = pick(opts.label, locale)
  const description = pick(opts.description, locale)
  if (label !== undefined) wire.label = label
  if (description !== undefined) wire.description = description
  if (typeof opts.required === "boolean") wire.required = opts.required
  if (typeof opts.entitlement === "string") wire.entitlement = opts.entitlement
  if (opts.default !== undefined) wire.default = opts.default
  if (typeof opts.min === "number") wire.min = opts.min
  if (typeof opts.max === "number") wire.max = opts.max
  if (typeof opts.item === "string") wire.item = opts.item
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
// Pass a locale to resolve localized labels and descriptions.
export function toWire(def: SettingsDef, locale?: string): SchemaDescriptor {
  return {
    version: "1.0",
    categories: Object.entries(def.categories).map(([id, category]) => ({
      id,
      name: pick(category.name, locale) ?? id,
      description: pick(category.description, locale),
      icon: category.icon,
      entitlement: category.entitlement,
      options: Object.entries(category.options).map(([oid, field]) =>
        optionToWire(oid, field, locale)
      ),
    })),
  }
}

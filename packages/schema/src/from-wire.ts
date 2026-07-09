import type { SchemaDescriptor, WireOption } from "@discord-dashboard/protocol"
import { f, type Field, type BaseFieldOpts } from "./fields.js"
import type { SettingsDef, CategoryDef } from "./define.js"

function enumToOptions(option: WireOption): Record<string, string> {
  return Object.fromEntries((option.enum ?? []).map((e) => [e.value, e.label]))
}

// Rebuild a validating field from a wire option. This lets the dashboard
// reconstruct a schema from any bot, regardless of the language it is written
// in, so remote settings can still be validated.
export function fieldFromWire(option: WireOption): Field {
  const opts: BaseFieldOpts & Record<string, unknown> = {}
  if (option.label !== undefined) opts.label = option.label
  if (option.description !== undefined) opts.description = option.description
  if (option.required !== undefined) opts.required = option.required
  if (option.entitlement !== undefined) opts.entitlement = option.entitlement
  if (option.default !== undefined) opts.default = option.default
  if (option.min !== undefined) opts.min = option.min
  if (option.max !== undefined) opts.max = option.max

  switch (option.type) {
    case "switch":
      return f.switch(opts)
    case "checkbox":
      return f.checkbox(opts)
    case "number":
      return f.number(opts)
    case "textarea":
      return f.textarea(opts)
    case "url":
      return f.url(opts)
    case "duration":
      return f.duration(opts)
    case "color":
      return f.color(opts)
    case "channel":
      return f.channel(opts)
    case "channelMulti":
      return f.channelMulti(opts)
    case "role":
      return f.role(opts)
    case "roleMulti":
      return f.roleMulti(opts)
    case "select":
      return f.select({ ...opts, options: enumToOptions(option) })
    case "multiSelect":
      return f.multiSelect({ ...opts, options: enumToOptions(option) })
    default:
      return f.text(opts)
  }
}

export function fromWire(descriptor: SchemaDescriptor): SettingsDef {
  const categories: Record<string, CategoryDef> = {}
  for (const category of descriptor.categories) {
    const options: Record<string, Field> = {}
    for (const option of category.options) {
      options[option.id] = fieldFromWire(option)
    }
    categories[category.id] = {
      name: category.name,
      description: category.description,
      icon: category.icon,
      entitlement: category.entitlement,
      options,
    }
  }
  return { categories }
}

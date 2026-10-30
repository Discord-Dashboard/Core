import type { SchemaDescriptor, WireOption } from "@acstane/protocol"
import { f, type Field, type BaseFieldOpts, type FieldFactory } from "./fields.js"
import type { SettingsDef, CategoryDef } from "./define.js"

function enumToOptions(option: WireOption): Record<string, string> {
  return Object.fromEntries((option.enum ?? []).map((e) => [e.value, e.label]))
}

// Rebuild a validating field from a wire option. This lets the dashboard
// reconstruct a schema from any bot, regardless of the language it is written
// in, so remote settings can still be validated. Pass a platform's own field
// factories as fields (Discord's embed) so its types are rebuilt too.
export function fieldFromWire(
  option: WireOption,
  fields: Record<string, FieldFactory> = {}
): Field {
  const opts: BaseFieldOpts & Record<string, unknown> = {}
  if (option.label !== undefined) opts.label = option.label
  if (option.description !== undefined) opts.description = option.description
  if (option.required !== undefined) opts.required = option.required
  if (option.entitlement !== undefined) opts.entitlement = option.entitlement
  if (option.default !== undefined) opts.default = option.default
  if (option.min !== undefined) opts.min = option.min
  if (option.max !== undefined) opts.max = option.max

  const custom = Object.hasOwn(fields, option.type) ? fields[option.type] : undefined
  if (custom) return custom(opts)

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
    case "ref":
      return f.ref(option.kind ?? "", {
        ...opts,
        multiple: option.multiple,
        filter: option.filter,
      })
    // Older bots and SDKs still send the Discord field names.
    case "channel":
    case "role":
      return f.ref(option.type, { ...opts, filter: option.filter })
    case "channelMulti":
    case "roleMulti":
      return f.ref(option.type.replace("Multi", ""), {
        ...opts,
        multiple: true,
        filter: option.filter,
      })
    case "select":
      return f.select({ ...opts, options: enumToOptions(option) })
    case "multiSelect":
      return f.multiSelect({ ...opts, options: enumToOptions(option) })
    case "list": {
      // Rebuild the item field from its type so the array validates its items,
      // rather than degrading the whole list to a plain string.
      const item = fieldFromWire({ id: option.id, type: option.item ?? "text" }, fields)
      return f.list(item, opts)
    }
    default:
      return f.text(opts)
  }
}

export function fromWire(
  descriptor: SchemaDescriptor,
  fields: Record<string, FieldFactory> = {}
): SettingsDef {
  const categories: Record<string, CategoryDef> = {}
  for (const category of descriptor.categories) {
    const options: Record<string, Field> = {}
    for (const option of category.options) {
      options[option.id] = fieldFromWire(option, fields)
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

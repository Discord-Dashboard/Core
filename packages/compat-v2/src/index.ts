import { defineSettings, type Field } from "@asctane-dashboard/schema"
import type { BotAdapter, SpaceSource } from "@asctane-dashboard/core"
import { f } from "@asctane-dashboard/platform-discord"

// What a v2 DBD.formTypes helper returned. Lists carry their labels in keys
// and the stored values in values.
interface V2FormType {
  type?: string
  data?: unknown
  min?: number | null
  max?: number | null
}

interface V2Option {
  optionId: string
  optionName?: string
  optionDescription?: string
  optionType?: V2FormType | string
  getActualSet?: (ctx: { guild: { id: string }; user: { id: string } }) => Promise<unknown>
  setNew?: (ctx: {
    guild: { id: string }
    user: { id: string }
    newData: unknown
  }) => Promise<unknown>
}
interface V2Category {
  categoryId: string
  categoryName?: string
  categoryDescription?: string
  categoryOptionsList: V2Option[]
}

export interface FromV2Options {
  // Live channels and roles for the pickers, usually
  // discordSourceFromClient(client). Without it the pickers are empty.
  source?: SpaceSource
}

// v2 mapped a label to the stored value, v3 maps the stored value to a label.
function optionsFrom(data: unknown): Record<string, string> {
  const { keys, values } = (data ?? {}) as { keys?: unknown[]; values?: unknown[] }
  if (!Array.isArray(keys) || !Array.isArray(values)) return {}
  return Object.fromEntries(values.map((v, i) => [String(v), String(keys[i] ?? v)]))
}

export function fieldFor(
  formType: V2FormType | string | undefined,
  name?: string,
  description?: string
): Field {
  const t: V2FormType = typeof formType === "string" ? { type: formType } : (formType ?? {})
  const opts = { label: name, ...(description ? { description } : {}) }
  const limits = {
    ...(typeof t.min === "number" ? { min: t.min } : {}),
    ...(typeof t.max === "number" ? { max: t.max } : {}),
  }
  switch (t.type) {
    case "switch":
      return f.switch(opts)
    case "checkbox":
      return f.checkbox(opts)
    case "input":
      return f.text({ ...opts, ...limits })
    case "textarea":
      return f.textarea({ ...opts, ...limits })
    case "select":
      return f.select({ ...opts, options: optionsFrom(t.data) })
    case "multiSelect":
      return f.multiSelect({ ...opts, options: optionsFrom(t.data) })
    // v2 kept a picker's channel types inside a function, so they are lost.
    case "channelsSelect":
      return f.channel(opts)
    case "channelsMultiSelect":
      return f.channelMulti(opts)
    case "rolesSelect":
      return f.role(opts)
    case "rolesMultiSelect":
      return f.roleMulti(opts)
    case "colorSelect":
      return f.color({ ...opts, ...(typeof t.data === "string" ? { default: t.data } : {}) })
    case "embedBuilder":
      return f.embed(opts)
    default:
      return f.text(opts)
  }
}

// Turns a v2 settings array into a v3 schema plus an adapter that calls the old
// getActualSet and setNew handlers. Existing bots start on v3 unchanged.
export function fromV2(settings: V2Category[], options: FromV2Options = {}) {
  const { source } = options
  const lookup = new Map<string, V2Option>()

  const def = defineSettings((s) => {
    const categories: Record<string, ReturnType<typeof s.category>> = {}
    for (const category of settings) {
      const options: Record<string, Field> = {}
      for (const option of category.categoryOptionsList) {
        lookup.set(`${category.categoryId}.${option.optionId}`, option)
        options[option.optionId] = fieldFor(
          option.optionType,
          option.optionName,
          option.optionDescription
        )
      }
      categories[category.categoryId] = s.category({
        name: category.categoryName ?? category.categoryId,
        ...(category.categoryDescription ? { description: category.categoryDescription } : {}),
        options,
      })
    }
    return categories
  })

  const adapter: BotAdapter = {
    async describeSchema(locale?: string) {
      const { toWire } = await import("@asctane-dashboard/schema")
      return toWire(def, locale)
    },
    async getChannels(spaceId, filter) {
      return (await source?.resources(spaceId, "channel", filter)) ?? []
    },
    async getRoles(spaceId, filter) {
      return (await source?.resources(spaceId, "role", filter)) ?? []
    },
    async getMemberPermissions(spaceId, userId) {
      return (await source?.memberPermissions(spaceId, userId)) ?? []
    },
    async getSetting(spaceId, key, actor) {
      const option = lookup.get(key)
      return (
        (await option?.getActualSet?.({
          guild: { id: spaceId },
          user: { id: actor?.userId ?? "" },
        })) ?? null
      )
    },
    async setSetting(spaceId, key, value, actor) {
      const option = lookup.get(key)
      await option?.setNew?.({
        guild: { id: spaceId },
        user: { id: actor?.userId ?? "" },
        newData: value,
      })
      return { ok: true }
    },
    async invokeAction(_spaceId: string, _name: string, _payload?: unknown) {
      return null
    },
  }

  return { def, adapter }
}

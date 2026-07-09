import { defineSettings, f, type Field } from "@discord-dashboard/schema"
import type { BotAdapter } from "@discord-dashboard/core"

interface V2Option {
  optionId: string
  optionName?: string
  optionType?: { type?: string } | string
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
  categoryOptionsList: V2Option[]
}

export function fieldFor(type: string | undefined, name?: string): Field {
  const opts = { label: name }
  switch (type) {
    case "switch":
    case "checkbox":
      return f.switch(opts)
    case "channelsSelect":
      return f.channel(opts)
    case "rolesSelect":
      return f.role(opts)
    case "multiSelect":
    case "channelsMultiSelect":
      return f.channelMulti(opts)
    case "rolesMultiSelect":
      return f.roleMulti(opts)
    case "textarea":
      return f.textarea(opts)
    default:
      return f.text(opts)
  }
}

// Turns a v2 settings array into a v3 schema plus an adapter that calls the old
// getActualSet and setNew handlers. Existing bots start on v3 unchanged.
export function fromV2(settings: V2Category[]) {
  const lookup = new Map<string, V2Option>()

  const def = defineSettings((s) => {
    const categories: Record<string, ReturnType<typeof s.category>> = {}
    for (const category of settings) {
      const options: Record<string, Field> = {}
      for (const option of category.categoryOptionsList) {
        lookup.set(`${category.categoryId}.${option.optionId}`, option)
        const type =
          typeof option.optionType === "string"
            ? option.optionType
            : option.optionType?.type
        options[option.optionId] = fieldFor(type, option.optionName)
      }
      categories[category.categoryId] = s.category({
        name: category.categoryName ?? category.categoryId,
        options,
      })
    }
    return categories
  })

  const adapter: BotAdapter = {
    async describeSchema(locale?: string) {
      const { toWire } = await import("@discord-dashboard/schema")
      return toWire(def, locale)
    },
    async getChannels() {
      return []
    },
    async getRoles() {
      return []
    },
    async getMemberPermissions() {
      return []
    },
    async getSetting(guildId, key) {
      const option = lookup.get(key)
      return (
        (await option?.getActualSet?.({
          guild: { id: guildId },
          user: { id: "" },
        })) ?? null
      )
    },
    async setSetting(guildId, key, value) {
      const option = lookup.get(key)
      await option?.setNew?.({
        guild: { id: guildId },
        user: { id: "" },
        newData: value,
      })
      return { ok: true }
    },
    async invokeAction(_guildId: string, _name: string, _payload?: unknown) {
      return null
    },
  }

  return { def, adapter }
}

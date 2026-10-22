import { z } from "zod"

// Text shown to users. A plain string, or a map of locale to string for i18n.
export type Localized = string | Record<string, string>

export interface BaseFieldOpts {
  label?: Localized
  description?: Localized
  required?: boolean
  entitlement?: string
  ui?: Record<string, unknown>
}

export interface Field {
  type: string
  opts: Record<string, unknown>
  zod: z.ZodTypeAny
}

// Builds a field of any type. The f factories below use it, and a platform
// package uses it for field types only that platform has (Discord's embed).
export function defineField(
  type: string,
  zod: z.ZodTypeAny,
  // BaseFieldOpts plus whatever else the type needs on the wire.
  opts: object = {}
): Field {
  return { type, zod, opts: { ...opts } as Record<string, unknown> }
}
const make = defineField

// Rebuilds a field from its wire options. A platform passes these to fromWire
// for its own field types.
export type FieldFactory = (opts: BaseFieldOpts) => Field

export interface RefFieldOpts extends BaseFieldOpts {
  // Pick several instead of one.
  multiple?: boolean
  // Narrows the picker. What it may contain depends on the platform and the
  // kind, such as { types: ["text"] } for Discord channels.
  filter?: Record<string, unknown>
}

// Defaults can arrive from the wire as untrusted strings, so a plain
// Boolean("false") would be wrong. Treat the usual falsey strings as false.
function boolDefault(value: unknown): boolean {
  if (typeof value === "string") {
    const v = value.trim().toLowerCase()
    return v !== "" && v !== "false" && v !== "0" && v !== "no"
  }
  return Boolean(value)
}

// Field factories. These replace the v2 formTypes helpers but carry a Zod type
// so the same definition validates on the server and renders on the client.
export const f = {
  text(opts: BaseFieldOpts & { min?: number; max?: number; default?: string } = {}): Field {
    let zod = z.string()
    if (typeof opts.min === "number") zod = zod.min(opts.min)
    if (typeof opts.max === "number") zod = zod.max(opts.max)
    return make("text", opts.required ? zod : zod.optional(), opts)
  },
  textarea(opts: BaseFieldOpts & { min?: number; max?: number } = {}): Field {
    return make("textarea", z.string().optional(), opts)
  },
  number(opts: BaseFieldOpts & { min?: number; max?: number; default?: number } = {}): Field {
    let zod = z.number()
    if (typeof opts.min === "number") zod = zod.min(opts.min)
    if (typeof opts.max === "number") zod = zod.max(opts.max)
    return make("number", opts.required ? zod : zod.optional(), opts)
  },
  switch(opts: BaseFieldOpts & { default?: boolean } = {}): Field {
    return make("switch", z.boolean().default(boolDefault(opts.default)), opts)
  },
  checkbox(opts: BaseFieldOpts & { default?: boolean } = {}): Field {
    return make("checkbox", z.boolean().default(boolDefault(opts.default)), opts)
  },
  select(opts: BaseFieldOpts & { options: Record<string, string>; default?: string }): Field {
    const keys = Object.keys(opts.options)
    const zod =
      keys.length > 0 ? z.enum([keys[0]!, ...keys.slice(1)]) : z.string()
    return make("select", zod, opts)
  },
  multiSelect(opts: BaseFieldOpts & { options: Record<string, string> }): Field {
    return make("multiSelect", z.array(z.string()), opts)
  },
  // A pick of something that lives in the space, such as a channel or a role,
  // listed live by the platform. The value is its id (or ids when multiple).
  ref(kind: string, opts: RefFieldOpts = {}): Field {
    const zod = opts.multiple ? z.array(z.string()) : z.string().optional()
    const { filter, multiple, ...rest } = opts
    return make("ref", zod, {
      ...rest,
      kind,
      ...(multiple ? { multiple: true } : {}),
      ...(filter ? { filter } : {}),
    })
  },
  // Aliases of f.ref for the alpha. Platform packages export typed versions.
  channel(opts: BaseFieldOpts & { types?: string[] } = {}): Field {
    const { types, ...rest } = opts
    return f.ref("channel", { ...rest, ...(types ? { filter: { types } } : {}) })
  },
  channelMulti(opts: BaseFieldOpts & { types?: string[] } = {}): Field {
    const { types, ...rest } = opts
    return f.ref("channel", { ...rest, multiple: true, ...(types ? { filter: { types } } : {}) })
  },
  role(opts: BaseFieldOpts & { hideHigher?: boolean } = {}): Field {
    const { hideHigher, ...rest } = opts
    return f.ref("role", { ...rest, ...(hideHigher ? { filter: { hideHigher } } : {}) })
  },
  roleMulti(opts: BaseFieldOpts & { hideHigher?: boolean } = {}): Field {
    const { hideHigher, ...rest } = opts
    return f.ref("role", { ...rest, multiple: true, ...(hideHigher ? { filter: { hideHigher } } : {}) })
  },
  color(opts: BaseFieldOpts & { default?: string } = {}): Field {
    return make("color", z.string().optional(), opts)
  },
  list(item: Field, opts: BaseFieldOpts & { max?: number } = {}): Field {
    return make("list", z.array(item.zod), { ...opts, item: item.type } as BaseFieldOpts)
  },
  url(opts: BaseFieldOpts = {}): Field {
    return make("url", z.string().regex(/^https?:\/\/.+/).optional(), opts)
  },
  duration(opts: BaseFieldOpts & { default?: string } = {}): Field {
    return make("duration", z.string().regex(/^\d+(s|m|h|d)$/).optional(), opts)
  },
}

export type Fields = typeof f

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

function make(type: string, zod: z.ZodTypeAny, opts: BaseFieldOpts = {}): Field {
  return { type, zod, opts: { ...opts } as Record<string, unknown> }
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
    return make("switch", z.boolean().default(Boolean(opts.default)), opts)
  },
  checkbox(opts: BaseFieldOpts & { default?: boolean } = {}): Field {
    return make("checkbox", z.boolean().default(Boolean(opts.default)), opts)
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
  channel(opts: BaseFieldOpts & { types?: string[] } = {}): Field {
    return make("channel", z.string().optional(), opts)
  },
  channelMulti(opts: BaseFieldOpts & { types?: string[] } = {}): Field {
    return make("channelMulti", z.array(z.string()), opts)
  },
  role(opts: BaseFieldOpts & { hideHigher?: boolean } = {}): Field {
    return make("role", z.string().optional(), opts)
  },
  roleMulti(opts: BaseFieldOpts & { hideHigher?: boolean } = {}): Field {
    return make("roleMulti", z.array(z.string()), opts)
  },
  color(opts: BaseFieldOpts & { default?: string } = {}): Field {
    return make("color", z.string().optional(), opts)
  },
  list(item: Field, opts: BaseFieldOpts & { max?: number } = {}): Field {
    return make("list", z.array(item.zod), { ...opts, item: item.type } as BaseFieldOpts)
  },
  embed(opts: BaseFieldOpts & { default?: unknown } = {}): Field {
    return make("embed", z.record(z.string(), z.unknown()).optional(), opts)
  },
  url(opts: BaseFieldOpts = {}): Field {
    return make("url", z.string().regex(/^https?:\/\/.+/).optional(), opts)
  },
  duration(opts: BaseFieldOpts & { default?: string } = {}): Field {
    return make("duration", z.string().regex(/^\d+(s|m|h|d)$/).optional(), opts)
  },
}

export type Fields = typeof f

import { z } from "zod"
import { isSafeUrl, URL_PROPS } from "./url.js"

// A page is data, never code. Only whitelisted component types are allowed, so
// a generated or user built page cannot inject markup or scripts.
export const COMPONENT_TYPES = [
  "Hero",
  "Heading",
  "Text",
  "Button",
  "Card",
  "Grid",
  "SettingsPanel",
  "Image",
  "Divider",
  "Spacer",
  "List",
] as const

function urlSafety(block: { props: Record<string, unknown> }, ctx: z.RefinementCtx) {
  // Reject unsafe urls at validation time so the AI and the drag and drop
  // editor can never persist a "javascript:" href or src.
  for (const prop of URL_PROPS) {
    const value = block.props[prop]
    if (typeof value === "string" && !isSafeUrl(value)) {
      ctx.addIssue({
        code: "custom",
        message: `unsafe url in ${prop}`,
        path: ["props", prop],
      })
    }
  }
}

// Build a block schema whose allowed component types are exactly `types`.
function blockSchemaFor(types: readonly string[]) {
  const typeSchema =
    types.length > 0
      ? z.enum([types[0]!, ...types.slice(1)])
      : z.never()
  return z
    .object({
      type: typeSchema,
      props: z.record(z.string(), z.unknown()).default({}),
    })
    .superRefine(urlSafety)
}

export const blockSchema = blockSchemaFor(COMPONENT_TYPES)

function pageSchemaWith(block: z.ZodTypeAny) {
  return z.object({
    version: z.literal(1),
    root: z.object({ title: z.string().max(120) }),
    content: z.array(block).max(200),
  })
}

export const pageSchema = pageSchemaWith(blockSchema)

// A page schema restricted to a catalog: only the intersection of the given
// catalog and the known component whitelist is accepted. This makes the catalog
// an enforced constraint, not just a hint in the AI prompt.
export function pageSchemaFor(catalog: readonly string[]) {
  const allowed = COMPONENT_TYPES.filter((t) => catalog.includes(t))
  return pageSchemaWith(blockSchemaFor(allowed))
}

export type Page = z.infer<typeof pageSchema>

import { z } from "zod"

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
] as const

export const blockSchema = z.object({
  type: z.enum(COMPONENT_TYPES),
  props: z.record(z.string(), z.unknown()).default({}),
})

export const pageSchema = z.object({
  version: z.literal(1),
  root: z.object({ title: z.string().max(120) }),
  content: z.array(blockSchema).max(200),
})

export type Page = z.infer<typeof pageSchema>

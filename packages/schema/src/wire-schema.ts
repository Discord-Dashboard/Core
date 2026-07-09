import { z } from "zod"

// A formal validator for the wire descriptor that bots return and the
// dashboard consumes. Keeping this as a schema guards the protocol format
// against accidental drift.
export const wireEnumOption = z.object({ value: z.string(), label: z.string() })

export const wireOption = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string().optional(),
  description: z.string().optional(),
  default: z.unknown().optional(),
  required: z.boolean().optional(),
  enum: z.array(wireEnumOption).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  entitlement: z.string().optional(),
  ui: z.record(z.string(), z.unknown()).optional(),
})

export const wireCategory = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  entitlement: z.string().optional(),
  options: z.array(wireOption),
})

export const wireDescriptor = z.object({
  version: z.string(),
  categories: z.array(wireCategory),
})

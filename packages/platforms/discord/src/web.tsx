// Browser side of the Discord platform: the field widgets only Discord has.
// The web app looks these up by platform and field type. Import this entry
// from the browser only; the package root pulls in server code.
import type { ReactElement } from "react"

export interface FieldWidgetProps {
  // The input id, so the field's label can point at it.
  id: string
  value: unknown
  onChange: (value: unknown) => void
}

export type FieldWidget = (props: FieldWidgetProps) => ReactElement

interface Embed {
  title?: string
  description?: string
  color?: string
}

function asEmbed(value: unknown): Embed {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Embed) : {}
}

// Edits the parts of a message embed most bots need. Every change saves the
// whole embed, so the bot always receives a complete object.
export function EmbedEditor({ id, value, onChange }: FieldWidgetProps) {
  const embed = asEmbed(value)
  const set = (patch: Embed) => onChange({ ...embed, ...patch })
  return (
    <span className="dd-embed" style={{ borderLeftColor: embed.color ?? "#5865f2" }}>
      <input
        id={id}
        placeholder="Title"
        value={embed.title ?? ""}
        maxLength={256}
        onChange={(e) => set({ title: e.target.value })}
      />
      <textarea
        aria-label="Description"
        placeholder="Description"
        value={embed.description ?? ""}
        maxLength={4096}
        onChange={(e) => set({ description: e.target.value })}
      />
      <input
        aria-label="Color"
        type="color"
        value={embed.color ?? "#5865f2"}
        onChange={(e) => set({ color: e.target.value })}
      />
    </span>
  )
}

// Widgets by field type, for the web app's per platform registry.
export const discordWidgets: Record<string, FieldWidget> = {
  embed: EmbedEditor,
}

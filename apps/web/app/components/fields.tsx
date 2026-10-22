"use client"

import { useEffect, useState, type ReactElement } from "react"
import { discordWidgets } from "@asctane-dashboard/platform-discord/web"
import { IconChevronDown } from "./icons"

const API = process.env.NEXT_PUBLIC_API ?? "http://localhost:3001"

export interface WireOption {
  id: string
  type: string
  label?: string
  enum?: { value: string; label: string }[]
  // Set on ref fields: what they pick, whether several, and the picker filter.
  kind?: string
  multiple?: boolean
  filter?: Record<string, unknown>
}

// The space a form edits, so a picker can list what lives in it.
export interface SpaceRef {
  platform: string
  id: string
}

export interface FieldProps {
  id: string
  option: WireOption
  value: unknown
  onChange: (value: unknown) => void
  space: SpaceRef
}

type Widget = (props: FieldProps) => ReactElement

function SwitchField({ id, value, onChange }: FieldProps) {
  return (
    <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
  )
}

function SelectField({ id, option, value, onChange }: FieldProps) {
  return (
    <span className="dd-select">
      <select id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
        {(option.enum ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <IconChevronDown size={14} />
    </span>
  )
}

function TextField({ id, value, onChange }: FieldProps) {
  return <input id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
}

// Picks channels, roles or whatever else the platform lists for this kind,
// loaded live from the bot.
function RefField({ id, option, value, onChange, space }: FieldProps) {
  const [items, setItems] = useState<{ label: string; value: string }[] | null>(null)
  const filter = option.filter ? JSON.stringify(option.filter) : ""
  useEffect(() => {
    const query = filter ? `?filter=${encodeURIComponent(filter)}` : ""
    fetch(
      `${API}/api/spaces/${space.platform}/${space.id}/resources/${option.kind}${query}`,
      { credentials: "include" }
    )
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items?: { label: string; value: string }[] }) => setItems(data.items ?? []))
      .catch(() => setItems([]))
  }, [space.platform, space.id, option.kind, filter])

  const list = items ?? []
  if (option.multiple) {
    const selected = Array.isArray(value) ? value.map(String) : []
    return (
      <select
        id={id}
        multiple
        value={selected}
        aria-busy={items === null}
        onChange={(e) => onChange(Array.from(e.target.selectedOptions, (o) => o.value))}
      >
        {list.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  }
  return (
    <span className="dd-select">
      <select
        id={id}
        value={String(value ?? "")}
        aria-busy={items === null}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        <option value="">None</option>
        {list.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <IconChevronDown size={14} />
    </span>
  )
}

const coreWidgets: Record<string, Widget> = {
  switch: SwitchField,
  checkbox: SwitchField,
  select: SelectField,
  ref: RefField,
}

// Field types only one platform has, such as Discord's embed, come from that
// platform's package.
const platformWidgets: Record<string, Record<string, Widget>> = {
  discord: discordWidgets,
}

// The widget for a field: the platform's own first, then core's, then a text
// input.
export function widgetFor(platform: string, type: string): Widget {
  return platformWidgets[platform]?.[type] ?? coreWidgets[type] ?? TextField
}

export function Field(props: FieldProps) {
  const Widget = widgetFor(props.space.platform, props.option.type)
  return <Widget {...props} />
}

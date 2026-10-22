"use client"

import { useEffect, useState, type ReactElement } from "react"
import { discordWidgets } from "@asctane-dashboard/platform-discord/web"
import { IconChevronDown } from "./icons"

const API = process.env.NEXT_PUBLIC_API ?? ""

export interface WireOption {
  id: string
  type: string
  label?: string
  description?: string
  required?: boolean
  min?: number
  max?: number
  enum?: { value: string; label: string }[]
  // Set on list fields: the type of each item.
  item?: string
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

function TextField({ id, option, value, onChange }: FieldProps) {
  return (
    <input
      id={id}
      value={String(value ?? "")}
      minLength={option.min}
      maxLength={option.max}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function TextareaField({ id, option, value, onChange }: FieldProps) {
  return (
    <textarea
      id={id}
      rows={3}
      value={String(value ?? "")}
      minLength={option.min}
      maxLength={option.max}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function ColorField({ id, value, onChange }: FieldProps) {
  return (
    <input
      id={id}
      type="color"
      className="dd-color"
      value={typeof value === "string" && value ? value : "#000000"}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function MultiSelectField({ id, option, value, onChange }: FieldProps) {
  const selected = Array.isArray(value) ? value.map(String) : []
  return (
    <select
      id={id}
      multiple
      value={selected}
      onChange={(e) => onChange(Array.from(e.target.selectedOptions, (o) => o.value))}
    >
      {(option.enum ?? []).map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// Turns what someone typed into the value to save. Returns invalid while the
// text cannot be saved yet, such as "10" before the unit of a duration.
const INVALID = Symbol("invalid")
type Parse = (text: string) => unknown

// An input that keeps its own text while it is being edited and saves when it
// loses focus or on Enter, so a half typed value is never sent.
function DraftInput({
  id,
  value,
  onChange,
  parse,
  format = (v) => (v === undefined || v === null ? "" : String(v)),
  multiline = false,
  type,
  placeholder,
  min,
  max,
}: Pick<FieldProps, "id" | "value" | "onChange"> & {
  parse: Parse
  format?: (value: unknown) => string
  multiline?: boolean
  type?: string
  placeholder?: string
  min?: number
  max?: number
}) {
  const [text, setText] = useState(() => format(value))
  const [invalid, setInvalid] = useState(false)
  const [editing, setEditing] = useState(false)
  // Follow saved and live updates while nobody is typing here.
  useEffect(() => {
    if (!editing) setText(format(value))
  }, [value, editing])

  const commit = () => {
    setEditing(false)
    const next = parse(text)
    if (next === INVALID) return setInvalid(true)
    setInvalid(false)
    if (format(next) !== format(value)) onChange(next)
  }
  const common = {
    id,
    value: text,
    "aria-invalid": invalid || undefined,
    onFocus: () => setEditing(true),
    onBlur: commit,
  }
  if (multiline) {
    return (
      <textarea {...common} rows={4} placeholder={placeholder} onChange={(e) => setText(e.target.value)} />
    )
  }
  return (
    <input
      {...common}
      type={type}
      placeholder={placeholder}
      min={min}
      max={max}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit()
      }}
    />
  )
}

function NumberField(props: FieldProps) {
  const { min, max } = props.option
  const parse: Parse = (text) => {
    if (text.trim() === "") return undefined
    const n = Number(text)
    if (!Number.isFinite(n)) return INVALID
    if ((min !== undefined && n < min) || (max !== undefined && n > max)) return INVALID
    return n
  }
  return <DraftInput {...props} type="number" min={min} max={max} parse={parse} />
}

function UrlField(props: FieldProps) {
  const parse: Parse = (text) => {
    const t = text.trim()
    if (t === "") return undefined
    return /^https?:\/\/.+/.test(t) ? t : INVALID
  }
  return <DraftInput {...props} type="url" placeholder="https://" parse={parse} />
}

function DurationField(props: FieldProps) {
  const parse: Parse = (text) => {
    const t = text.trim()
    if (t === "") return undefined
    return /^\d+(s|m|h|d)$/.test(t) ? t : INVALID
  }
  return <DraftInput {...props} placeholder="10m, 2h or 7d" parse={parse} />
}

// One entry per line. Number lists save numbers.
function ListField(props: FieldProps) {
  const numbers = props.option.item === "number"
  const parse: Parse = (text) => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
    if (props.option.max !== undefined && lines.length > props.option.max) return INVALID
    if (!numbers) return lines
    const values = lines.map(Number)
    return values.every(Number.isFinite) ? values : INVALID
  }
  const format = (v: unknown) => (Array.isArray(v) ? v.map(String).join("\n") : "")
  return <DraftInput {...props} multiline placeholder="One per line" parse={parse} format={format} />
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
  text: TextField,
  textarea: TextareaField,
  number: NumberField,
  switch: SwitchField,
  checkbox: SwitchField,
  select: SelectField,
  multiSelect: MultiSelectField,
  ref: RefField,
  color: ColorField,
  url: UrlField,
  duration: DurationField,
  list: ListField,
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

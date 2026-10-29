"use client"

import { useEffect, useRef, useState, type ReactElement } from "react"
import { discordWidgets } from "@asctane-dashboard/platform-discord/web"
import { IconCheck, IconChevronDown, IconX } from "./icons"

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

interface Choice {
  label: string
  value: string
}

// A picker label without the tree lines a platform draws in front of nested
// items, for the chips.
const chipLabel = (label: string) => label.replace(/^[\s\u2500-\u257f]+/, "")

// Picks several values: the chosen ones show as chips, and typing filters a
// list to add more. Backspace in the empty search removes the last chip.
function MultiPicker({
  id,
  choices,
  value,
  onChange,
  loading = false,
  placeholder = "Search",
}: {
  id: string
  choices: Choice[]
  value: unknown
  onChange: (value: string[]) => void
  loading?: boolean
  placeholder?: string
}) {
  const selected = Array.isArray(value) ? value.map(String) : []
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const listId = `${id}-list`

  const q = query.trim().toLowerCase()
  const shown = q ? choices.filter((c) => c.label.toLowerCase().includes(q)) : choices
  const labelOf = (v: string) => chipLabel(choices.find((c) => c.value === v)?.label ?? v)

  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v])

  return (
    <div
      className={`dd-multi${open ? " is-open" : ""}`}
      ref={root}
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <div className="dd-multi__box" onClick={() => root.current?.querySelector("input")?.focus()}>
        {selected.map((v) => (
          <span className="dd-multi__chip" key={v}>
            <span>{labelOf(v)}</span>
            <button
              type="button"
              className="dd-multi__remove"
              aria-label={`Remove ${labelOf(v)}`}
              onClick={(e) => {
                e.stopPropagation()
                toggle(v)
              }}
            >
              <IconX size={12} />
            </button>
          </span>
        ))}
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-busy={loading || undefined}
          autoComplete="off"
          value={query}
          placeholder={selected.length ? "Add more" : placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false)
            else if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
              setActive((i) => Math.min(i + 1, shown.length - 1))
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              setActive((i) => Math.max(i - 1, 0))
            } else if (e.key === "Enter") {
              e.preventDefault()
              const pick = shown[active]
              if (open && pick) toggle(pick.value)
            } else if (e.key === "Backspace" && query === "" && selected.length) {
              onChange(selected.slice(0, -1))
            }
          }}
        />
        <IconChevronDown size={14} className="dd-multi__chev" />
      </div>
      {open && (
        <ul className="dd-multi__list" id={listId} role="listbox" aria-multiselectable="true">
          {loading ? (
            <li className="dd-multi__empty">Loading…</li>
          ) : shown.length === 0 ? (
            <li className="dd-multi__empty">Nothing matches</li>
          ) : (
            shown.map((c, i) => {
              const on = selected.includes(c.value)
              return (
                <li
                  key={c.value}
                  role="option"
                  aria-selected={on}
                  className={`dd-multi__option${i === active ? " is-active" : ""}`}
                  // Keeps the focus in the search, so the list stays open.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => toggle(c.value)}
                >
                  <span className="dd-multi__check" aria-hidden>
                    {on && <IconCheck size={13} />}
                  </span>
                  <span className="dd-multi__label">{c.label}</span>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}

function MultiSelectField({ id, option, value, onChange }: FieldProps) {
  return <MultiPicker id={id} choices={option.enum ?? []} value={value} onChange={onChange} />
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
    return (
      <MultiPicker
        id={id}
        choices={list}
        value={value}
        onChange={onChange}
        loading={items === null}
        placeholder={option.kind ? `Search ${option.kind}s` : "Search"}
      />
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

import type { Config, Data } from "@puckeditor/core"
import type { Page } from "./schema.js"
import { safeUrl } from "./url.js"

// The whitelist of components a page may use. Rendering only goes through this
// map, so a page can never introduce raw markup or scripts.
export const puckConfig: Config = {
  root: {
    fields: { title: { type: "text", label: "Page title" } },
  },
  components: {
    Hero: {
      fields: { title: { type: "text" }, subtitle: { type: "text" } },
      render: ({ title, subtitle }) => (
        <section>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </section>
      ),
    },
    Heading: {
      fields: { text: { type: "text" } },
      render: ({ text }) => <h2>{text}</h2>,
    },
    Text: {
      fields: { text: { type: "textarea" } },
      render: ({ text }) => <p>{text}</p>,
    },
    Button: {
      fields: { label: { type: "text" }, href: { type: "text" } },
      render: ({ label, href }) => <a href={safeUrl(href)}>{label}</a>,
    },
    Card: {
      fields: { title: { type: "text" }, body: { type: "textarea" } },
      render: ({ title, body }) => (
        <div>
          <strong>{title}</strong>
          <p>{body}</p>
        </div>
      ),
    },
    Image: {
      fields: { src: { type: "text" }, alt: { type: "text" } },
      render: ({ src, alt }) => (
        <img src={safeUrl(src)} alt={alt} style={{ maxWidth: "100%" }} />
      ),
    },
    Grid: {
      fields: { columns: { type: "number" } },
      render: ({ columns }) => (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns || 2}, 1fr)`,
            gap: 16,
          }}
        />
      ),
    },
    SettingsPanel: {
      fields: { category: { type: "text" } },
      render: ({ category }) => (
        <div data-settings-panel={category}>Settings: {category}</div>
      ),
    },
    Divider: {
      fields: {},
      render: () => <hr />,
    },
    Spacer: {
      fields: { height: { type: "number" } },
      render: ({ height }) => (
        <div style={{ height: Number(height) || 16 }} />
      ),
    },
    List: {
      fields: {
        items: {
          type: "array",
          arrayFields: { text: { type: "text" } },
        },
      },
      render: ({ items }) => (
        <ul>
          {(Array.isArray(items) ? items : []).map((item, i) => (
            <li key={i}>
              {typeof item === "string" ? item : String((item as { text?: unknown })?.text ?? "")}
            </li>
          ))}
        </ul>
      ),
    },
  },
}

// A stored page and the editor's data differ a little: the editor keeps the
// page title in root props and gives every block an id. These convert between
// the two. The server validates the result of fromPuckData like any other page.
interface Block {
  type: string
  props: Record<string, unknown>
}

export function toPuckData(page: Page): Data {
  return {
    root: { props: { title: page.root.title } },
    content: (page.content as Block[]).map((block, i) => ({
      type: block.type,
      props: { ...block.props, id: `${block.type}-${i}` },
    })),
  }
}

export function fromPuckData(data: Partial<Data>, fallbackTitle = "Untitled"): Page {
  const title = (data.root?.props as { title?: unknown } | undefined)?.title
  return {
    version: 1,
    root: { title: typeof title === "string" && title.trim() ? title : fallbackTitle },
    content: (data.content ?? []).map((block) => {
      const { id: _id, ...props } = block.props as Record<string, unknown>
      return { type: block.type, props }
    }),
  }
}

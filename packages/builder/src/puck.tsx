import type { Config } from "@measured/puck"
import { safeUrl } from "./url.js"

// The whitelist of components a page may use. Rendering only goes through this
// map, so a page can never introduce raw markup or scripts.
export const puckConfig: Config = {
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
  },
}

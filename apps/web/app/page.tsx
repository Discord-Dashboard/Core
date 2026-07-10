import {
  IconSparkles,
  IconSliders,
  IconWand,
  IconGlobe,
  IconShield,
  IconBolt,
  IconPalette,
  IconArrowRight,
  IconCheck,
  IconHome,
  IconLayout,
  IconUsers,
  IconActivity,
} from "./components/icons"

const features = [
  {
    icon: IconSliders,
    title: "Schema driven settings",
    body: "Declare your bot's settings once. The dashboard renders toggles, selects and inputs — and validates every change — automatically.",
  },
  {
    icon: IconWand,
    title: "Drag and drop builder",
    body: "Compose custom pages from safe, whitelisted components, or generate them with AI. Pages are validated data, never code.",
  },
  {
    icon: IconGlobe,
    title: "Any language",
    body: "Connect a bot written in any language over a small, signed protocol. TypeScript and Python SDKs ship in the box.",
  },
  {
    icon: IconShield,
    title: "Secure by default",
    body: "PKCE, CSRF protection, rate limits, host-locked cookies and validated pages out of the box. No footguns to disarm.",
  },
  {
    icon: IconBolt,
    title: "Live sync",
    body: "Settings stream over server-sent events, so every admin and the bot itself see changes the instant they happen.",
  },
  {
    icon: IconPalette,
    title: "Fully themeable",
    body: "Every pixel is driven by design tokens. Swap a theme module and the entire dashboard rebrands — no component edits.",
  },
]

const stats = [
  { value: "1 schema", label: "Settings UI, generated" },
  { value: "< 50 ms", label: "Live setting propagation" },
  { value: "9 blocks", label: "Safe page components" },
  { value: "MIT", label: "Open source, forever" },
]

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="dd-hero">
        <span className="dd-badge">
          <IconSparkles size={14} />
          Open source, MIT licensed
        </span>
        <h1>
          The dashboard your <span className="dd-gradient-text">Discord bot</span> deserves.
        </h1>
        <p className="dd-hero__sub">
          Configure your bot from the web, build custom pages without writing
          code, and manage every server from one modern, real-time control
          panel.
        </p>
        <div className="dd-hero__ctas">
          <a className="dd-btn dd-btn--primary dd-btn--lg" href="/auth/discord">
            Login with Discord
            <IconArrowRight size={17} />
          </a>
          <a className="dd-btn dd-btn--lg" href="/builder">
            Open the builder
          </a>
        </div>
        <div className="dd-hero__meta">
          <span>
            <IconCheck size={14} />
            Self-hosted
          </span>
          <span>
            <IconCheck size={14} />
            No tracking
          </span>
          <span>
            <IconCheck size={14} />
            Works with any bot
          </span>
        </div>

        {/* Faux product preview */}
        <div className="dd-preview" aria-hidden>
          <div className="dd-preview__bar">
            <span className="dd-preview__dot" />
            <span className="dd-preview__dot" />
            <span className="dd-preview__dot" />
            <span className="dd-preview__url">dashboard.yourbot.gg/dashboard</span>
          </div>
          <div className="dd-preview__body">
            <div className="dd-preview__side">
              <span className="dd-preview__navitem is-active">
                <IconHome size={14} />
                Overview
              </span>
              <span className="dd-preview__navitem">
                <IconSliders size={14} />
                Moderation
              </span>
              <span className="dd-preview__navitem">
                <IconUsers size={14} />
                Welcome
              </span>
              <span className="dd-preview__navitem">
                <IconActivity size={14} />
                Logging
              </span>
              <span className="dd-preview__navitem">
                <IconLayout size={14} />
                Pages
              </span>
            </div>
            <div className="dd-preview__main">
              <div className="dd-preview__row">
                <span className="dd-preview__label">
                  <strong>Auto moderation</strong>
                  <span>Filter spam, invites and mass mentions</span>
                </span>
                <span className="dd-preview__toggle is-on" />
              </div>
              <div className="dd-preview__row">
                <span className="dd-preview__label">
                  <strong>Welcome messages</strong>
                  <span>Greet members in #welcome</span>
                </span>
                <span className="dd-preview__toggle is-on" />
              </div>
              <div className="dd-preview__row">
                <span className="dd-preview__label">
                  <strong>Ghost ping detection</strong>
                  <span>Log deleted mentions</span>
                </span>
                <span className="dd-preview__toggle" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="dd-section" aria-label="Highlights">
        <div className="dd-stats">
          {stats.map((s) => (
            <div className="dd-stat" key={s.label}>
              <span className="dd-stat__value">{s.value}</span>
              <span className="dd-stat__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="dd-section" id="features">
        <div className="dd-section__head">
          <span className="dd-kicker">
            <IconBolt size={13} />
            Everything included
          </span>
          <h2>One control panel, every superpower</h2>
          <p>
            From schema-driven settings to a visual page builder, everything a
            production bot dashboard needs ships in the box.
          </p>
        </div>
        <div className="dd-features">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <article className="dd-feature" key={f.title}>
                <span className="dd-card__icon" aria-hidden>
                  <Icon size={17} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </article>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="dd-section">
        <div className="dd-cta">
          <h2>Ship a beautiful dashboard tonight.</h2>
          <p>
            Log in with Discord, point it at your bot, and give your community
            the control panel it has been asking for.
          </p>
          <a className="dd-btn dd-btn--lg" href="/auth/discord">
            Get started free
            <IconArrowRight size={17} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="dd-footer">
        <div className="dd-footer__inner">
          <span>© {new Date().getFullYear()} discord-dashboard — MIT licensed</span>
          <nav className="dd-footer__links" aria-label="Footer">
            <a href="/#features">Features</a>
            <a href="/builder">Builder</a>
            <a href="/manage">Servers</a>
            <a href="https://github.com">GitHub</a>
          </nav>
        </div>
      </footer>
    </main>
  )
}

const features = [
  { title: "Schema driven settings", body: "Declare your bot's settings once. The dashboard renders and validates them." },
  { title: "Drag and drop builder", body: "Compose custom pages from safe, whitelisted components, or generate them with AI." },
  { title: "Any language", body: "Connect a bot written in any language over a small, signed protocol." },
  { title: "Secure by default", body: "PKCE, CSRF, rate limits, host locked cookies, and validated pages out of the box." },
]

export default function Home() {
  return (
    <main className="dd-container dd-stack">
      <section className="dd-hero">
        <span className="dd-badge">Open source, MIT</span>
        <h1>The dashboard your Discord bot deserves.</h1>
        <p>
          Configure your bot from the web, build pages without code, and manage
          every server from one modern control panel.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
          <a className="dd-btn dd-btn--primary" href="/auth/discord">
            Login with Discord
          </a>
          <a className="dd-btn" href="/builder">
            Open the builder
          </a>
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {features.map((f) => (
          <div className="dd-card" key={f.title}>
            <div className="dd-card__head">
              <span className="dd-dot" aria-hidden />
              <h2 style={{ textTransform: "none", letterSpacing: "-0.01em", fontSize: "1rem", color: "var(--dd-color-text)" }}>
                {f.title}
              </h2>
            </div>
            <p>{f.body}</p>
          </div>
        ))}
      </div>
    </main>
  )
}

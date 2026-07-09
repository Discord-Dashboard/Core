export default function Home() {
  return (
    <main style={{ padding: 48, maxWidth: 640 }}>
      <h1>discord-dashboard</h1>
      <p>
        Open source dashboard framework for Discord bots. Configure your bot from
        the web, build pages without code, and manage every server in one place.
      </p>
      <p>
        <a href="/auth/discord">Login with Discord</a>
      </p>
      <nav>
        <ul>
          <li>
            <a href="/manage">Manage your servers</a>
          </li>
          <li>
            <a href="/builder">Page builder</a>
          </li>
        </ul>
      </nav>
    </main>
  )
}

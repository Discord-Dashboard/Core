// Renders the settings form generically from the schema returned by the bot.
export default function GuildDashboard({
  params,
}: {
  params: { guildId: string }
}) {
  return (
    <main style={{ padding: 48 }}>
      <h1>Guild {params.guildId}</h1>
      <p>Settings render here from the bot schema.</p>
    </main>
  )
}

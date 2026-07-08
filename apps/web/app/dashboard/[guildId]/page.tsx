import { SettingsForm } from "./SettingsForm"

export default function GuildDashboard({
  params,
}: {
  params: { guildId: string }
}) {
  return (
    <main style={{ padding: 48 }}>
      <h1>Guild {params.guildId}</h1>
      <SettingsForm guildId={params.guildId} />
    </main>
  )
}

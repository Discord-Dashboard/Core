import { SettingsForm } from "./SettingsForm"

export default async function GuildDashboard({
  params,
}: {
  params: Promise<{ guildId: string }>
}) {
  const { guildId } = await params
  return (
    <main style={{ padding: 48 }}>
      <h1>Guild {guildId}</h1>
      <SettingsForm guildId={guildId} />
    </main>
  )
}

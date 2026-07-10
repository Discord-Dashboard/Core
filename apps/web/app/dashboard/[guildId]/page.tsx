import { SettingsForm } from "./SettingsForm"

export default async function GuildDashboard({
  params,
}: {
  params: Promise<{ guildId: string }>
}) {
  const { guildId } = await params
  return (
    <main className="dd-stack">
      <SettingsForm guildId={guildId} />
    </main>
  )
}

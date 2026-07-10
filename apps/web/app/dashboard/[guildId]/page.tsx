import { SettingsForm } from "./SettingsForm"

export default async function GuildDashboard({
  params,
}: {
  params: Promise<{ guildId: string }>
}) {
  const { guildId } = await params
  return (
    <main className="dd-container dd-stack">
      <div>
        <h1 className="dd-page-title">Server settings</h1>
        <p className="dd-page-sub">
          Changes save instantly and sync live to everyone editing this server.
        </p>
      </div>
      <SettingsForm guildId={guildId} />
    </main>
  )
}

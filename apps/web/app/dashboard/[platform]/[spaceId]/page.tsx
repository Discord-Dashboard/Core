import { SettingsForm } from "./SettingsForm"

export default async function SpaceDashboard({
  params,
}: {
  params: Promise<{ platform: string; spaceId: string }>
}) {
  const { platform, spaceId } = await params
  return (
    <main className="dd-stack">
      <SettingsForm platform={platform} spaceId={spaceId} />
    </main>
  )
}

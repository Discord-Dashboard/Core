import { Suspense } from "react"
import { DashboardPage } from "./DashboardPage"

// The space comes from the query string (/dashboard?platform=discord&space=123),
// so the page is one static file that the prebuilt dashboard can serve for
// every space.
export default function SpaceDashboard() {
  return (
    <main className="dd-stack">
      <Suspense>
        <DashboardPage />
      </Suspense>
    </main>
  )
}

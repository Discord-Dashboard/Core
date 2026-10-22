import { Suspense } from "react"
import { PublicPage } from "./PublicPage"

// The slug comes from the query string (/p?slug=welcome), so the page is one
// static file that the prebuilt dashboard can serve for every published page.
export default function Page() {
  return (
    <Suspense>
      <PublicPage />
    </Suspense>
  )
}

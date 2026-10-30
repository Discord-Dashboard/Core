import { Suspense } from "react"
import { EditorLoader } from "./EditorLoader"

// The slug comes from the query string (/builder/edit?slug=home), so the editor
// is one static file the prebuilt dashboard serves for every page.
export default function Page() {
  return (
    <Suspense>
      <EditorLoader />
    </Suspense>
  )
}

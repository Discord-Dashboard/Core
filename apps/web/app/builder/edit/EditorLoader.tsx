"use client"

import dynamic from "next/dynamic"

// The editor only runs in the browser, and it's large, so it loads on demand.
const Editor = dynamic(() => import("./Editor").then((m) => m.Editor), {
  ssr: false,
  loading: () => <div className="dd-skeleton" style={{ minHeight: 480 }} />,
})

export function EditorLoader() {
  return <Editor />
}

import "@discord-dashboard/ui"
import "./globals.css"
import { themeToCss } from "@discord-dashboard/ui"
import { defaultTheme } from "@discord-dashboard/theme-default"
import { AppShell } from "./components/AppShell"
import type { ReactNode } from "react"

export const metadata = {
  title: "Discord Dashboard — the control panel your bot deserves",
  description: "Open source dashboard for Discord bots",
}

// The default theme module supplies the base tokens. themeToCss only emits
// validated custom properties, so injecting it here is safe.
const baseThemeCss = themeToCss(defaultTheme.tokens)

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: baseThemeCss }} />
      </head>
      <body>
        <div className="dd-bg" aria-hidden>
          <div className="dd-bg__glow dd-bg__glow--1" />
          <div className="dd-bg__glow dd-bg__glow--2" />
          <div className="dd-bg__grid" />
        </div>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}

import "@discord-dashboard/ui"
import "./globals.css"
import { themeToCss } from "@discord-dashboard/ui"
import { defaultTheme } from "@discord-dashboard/theme-default"
import { ThemeSwitcher } from "./ThemeSwitcher"
import type { ReactNode } from "react"

export const metadata = {
  title: "discord-dashboard",
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
        <ThemeSwitcher />
        {children}
      </body>
    </html>
  )
}

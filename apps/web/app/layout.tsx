import "@discord-dashboard/ui"
import "./globals.css"
import { ThemeSwitcher } from "./ThemeSwitcher"
import type { ReactNode } from "react"

export const metadata = {
  title: "discord-dashboard",
  description: "Open source dashboard for Discord bots",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeSwitcher />
        {children}
      </body>
    </html>
  )
}

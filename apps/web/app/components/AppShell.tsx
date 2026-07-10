"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { ThemeSwitcher } from "../ThemeSwitcher"
import {
  IconLogo,
  IconHome,
  IconServers,
  IconLayout,
  IconSliders,
  IconGitBranch,
  IconDoc,
  IconExternal,
  IconSparkles,
} from "./icons"

// Primary navigation. The dashboard route is matched by prefix so the active
// state survives deep links like /dashboard/123.
const nav = [
  { href: "/", label: "Overview", icon: IconHome, exact: true },
  { href: "/manage", label: "Servers", icon: IconServers },
  { href: "/builder", label: "Page builder", icon: IconLayout },
]

const resources = [
  { href: "https://github.com", label: "GitHub", icon: IconGitBranch },
  { href: "/#features", label: "Docs", icon: IconDoc },
]

function pageTitle(pathname: string): string {
  if (pathname.startsWith("/manage")) return "Servers"
  if (pathname.startsWith("/dashboard")) return "Server settings"
  if (pathname.startsWith("/builder")) return "Page builder"
  return "Overview"
}

// The application chrome. Marketing routes ("/" and published pages) get a
// slim centered header; app routes get the full sidebar + top bar shell.
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/"
  const isMarketing = pathname === "/" || pathname.startsWith("/p/")

  if (isMarketing) {
    return (
      <div className="dd-marketing">
        <header className="dd-mktnav">
          <a className="dd-brand" href="/">
            <span className="dd-brand__mark" aria-hidden>
              <IconLogo size={17} />
            </span>
            <span className="dd-brand__name">
              discord<span className="dd-brand__accent">dashboard</span>
            </span>
          </a>
          <nav className="dd-mktnav__links" aria-label="Primary">
            <a href="/#features">Features</a>
            <a href="/builder">Builder</a>
            <a href="/manage">Servers</a>
          </nav>
          <div className="dd-mktnav__actions">
            <ThemeSwitcher />
            <a className="dd-btn dd-btn--primary dd-btn--sm" href="/auth/discord">
              <IconSparkles size={15} />
              Get started
            </a>
          </div>
        </header>
        {children}
      </div>
    )
  }

  return (
    <div className="dd-shell">
      <aside className="dd-sidebar">
        <a className="dd-brand dd-sidebar__brand" href="/">
          <span className="dd-brand__mark" aria-hidden>
            <IconLogo size={17} />
          </span>
          <span className="dd-brand__name">
            discord<span className="dd-brand__accent">dashboard</span>
          </span>
        </a>

        <nav className="dd-sidebar__nav" aria-label="Primary">
          <p className="dd-sidebar__heading">Workspace</p>
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href) ||
                (item.href === "/manage" && pathname.startsWith("/dashboard"))
            const Icon = item.icon
            return (
              <a
                key={item.href}
                href={item.href}
                className={`dd-navlink${active ? " is-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </a>
            )
          })}

          <p className="dd-sidebar__heading">Resources</p>
          {resources.map((item) => {
            const Icon = item.icon
            return (
              <a key={item.label} href={item.href} className="dd-navlink">
                <Icon size={17} />
                <span>{item.label}</span>
                <IconExternal size={13} className="dd-navlink__ext" />
              </a>
            )
          })}
        </nav>

        <div className="dd-sidebar__footer">
          <div className="dd-upsell">
            <span className="dd-upsell__icon" aria-hidden>
              <IconSliders size={15} />
            </span>
            <div>
              <strong>Open source</strong>
              <p>MIT licensed, self-hosted, yours.</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="dd-main">
        <header className="dd-topbar">
          <div className="dd-topbar__crumbs">
            <span className="dd-topbar__app">Console</span>
            <span className="dd-topbar__sep" aria-hidden>
              /
            </span>
            <span className="dd-topbar__title">{pageTitle(pathname)}</span>
          </div>
          <div className="dd-topbar__actions">
            <ThemeSwitcher />
            <span className="dd-userchip" title="Signed in with Discord">
              <span className="dd-userchip__avatar" aria-hidden>
                A
              </span>
              <span className="dd-userchip__name">Admin</span>
            </span>
          </div>
        </header>
        <div className="dd-content">{children}</div>
      </div>
    </div>
  )
}

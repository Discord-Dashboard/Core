"use client"

import { usePathname } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { ThemeSwitcher } from "../ThemeSwitcher"
import { avatarUrl, logout, useSession, type SessionUser } from "./session"
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
// state survives deep links like /dashboard/discord/123.
const nav = [
  { href: "/", label: "Overview", icon: IconHome, exact: true },
  { href: "/manage", label: "Servers", icon: IconServers },
  { href: "/builder", label: "Page builder", icon: IconLayout },
]

const resources = [
  { href: "https://github.com/Discord-Dashboard/Core", label: "GitHub", icon: IconGitBranch },
  { href: "https://github.com/Discord-Dashboard/Core/tree/v3/meta/dashboard#readme", label: "Docs", icon: IconDoc },
]

function pageTitle(pathname: string): string {
  if (pathname.startsWith("/manage")) return "Servers"
  if (pathname.startsWith("/dashboard")) return "Server settings"
  if (pathname.startsWith("/builder")) return "Page builder"
  if (pathname.startsWith("/login")) return "Log in"
  return "Overview"
}

function UserChip({ user }: { user: SessionUser }) {
  const name = user.username ?? "Signed in"
  const picture = avatarUrl(user)
  return (
    <span className="dd-userchip" title={`Signed in as ${name}`}>
      {picture ? (
        <img className="dd-userchip__avatar" src={picture} alt="" />
      ) : (
        <span className="dd-userchip__avatar" aria-hidden>
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="dd-userchip__name">{name}</span>
      <button type="button" className="dd-userchip__logout" onClick={() => logout()}>
        Log out
      </button>
    </span>
  )
}

// The application chrome. Marketing routes ("/" and published pages) get a
// slim centered header; app routes get the full sidebar + top bar shell.
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/"
  const isMarketing = pathname === "/" || pathname.startsWith("/p/")
  const session = useSession()
  // Every app page but the login page needs a login. The API refuses the data
  // anyway; this sends a logged out visitor to log in instead of an empty page.
  const needsLogin = !isMarketing && !pathname.startsWith("/login")
  useEffect(() => {
    if (needsLogin && session === null) window.location.replace("/login")
  }, [needsLogin, session])

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
            <a className="dd-btn dd-btn--primary dd-btn--sm" href="/login">
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
            {session ? (
              <UserChip user={session} />
            ) : session === null ? (
              <a className="dd-btn dd-btn--primary dd-btn--sm" href="/login">
                Log in
              </a>
            ) : null}
          </div>
        </header>
        <div className="dd-content">
          {needsLogin && !session ? (
            <div className="dd-skeleton" style={{ minHeight: 180 }} aria-busy="true" />
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  )
}

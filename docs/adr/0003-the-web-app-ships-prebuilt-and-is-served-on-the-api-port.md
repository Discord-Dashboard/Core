# ADR 3: The web app ships prebuilt and is served on the API port

- Status: Accepted
- Date: 2026-10-22

**Context.** The Next.js web app was private, so a bot installed from npm got the API but no pages, and had to clone the repo to run a second server.

**Decision.** `@acstane/web` is a static Next.js export published as a package, and `createDashboard` serves it on the API's own port. `web: false` turns it off and `web: { root }` serves your own build. Decided on Core #115, merged as PR #135.

**Consequences.** One port and one process, as in v2, with no Next.js server at runtime. Dynamic routes became query parameters (`/dashboard/?platform=&space=`). The default allowed origin is the redirect URI's origin, and the CSP allows inline scripts for the export.

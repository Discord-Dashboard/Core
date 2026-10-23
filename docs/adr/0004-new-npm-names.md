# ADR 4: New npm names

- Status: Accepted
- Date: 2026-10-22

**Context.** `discord-dashboard` on npm carries v2 and old 3.0.x prereleases, and a range such as `^3.0.0-alpha.0` resolves to one of those old betas. v3 is also no longer Discord only (ADR 1).

**Decision.** The main package is `asctane-dashboard`, every other package is `@asctane-dashboard/*`, and the scaffolder is `@asctane-dashboard/create` (`npm init @asctane-dashboard`). They are published from zVapor's npm account. The version starts at 3.1.0 to sit above the old 3.0.x prereleases. The Python SDK keeps its PyPI name for now. Merged as Core PR #123.

**Consequences.** `discord-dashboard` stays the v2 package. The npm org `asctane-dashboard` has to exist before the first publish.

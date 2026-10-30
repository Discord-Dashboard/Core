# ADR 12: Packages move to the Acstane npm org

- Status: Accepted
- Date: 2026-10-30
- Supersedes: [ADR 4](0004-new-npm-names.md)

**Context.** ADR 4 published v3 as `asctane-dashboard` and `@asctane-dashboard/*`. The name was a misspelling of Acstane, and Acstane already has an npm org, `acstane`, which holds the Acstane Design System as `@acstane/ui`.

**Decision.** From 3.1.0-beta.1, every package lives in the `acstane` org with a plain name: the main package is `@acstane/dashboard`, the engine is `@acstane/core`, the scaffolder is `@acstane/create` (`npm init @acstane`), and the rest keep their old suffix (`@acstane/schema`, `@acstane/module-tickets` and so on). The one exception is the component library: it is `@acstane/dashboard-ui`, because `@acstane/ui` is the design system. The Python SDK keeps its PyPI name.

**Consequences.** The new names are new packages, so the first `@acstane/*` beta is published by hand once and then linked to CI with `pnpm npm:trust` (ADR 6). The `asctane-dashboard` and `@asctane-dashboard/*` 3.1.0-beta.0 packages are deprecated with a pointer to the new names. Publishing needs a member of the `acstane` org with publish rights.

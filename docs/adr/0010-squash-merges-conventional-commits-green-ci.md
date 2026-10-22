# ADR 10: Squash merges, Conventional Commits, green CI

- Status: Accepted
- Date: 2026-10-22

**Decision.** One change per pull request, branched from `v3`, with a Conventional Commits title such as `feat(sdk): ...`. A pull request is squash merged once CI is green: lint, typecheck, the TypeScript and Python tests, the build and `pnpm smoke:pack`.

**Consequences.** `v3` history reads as one line per change, and the changelog can be built from the titles.

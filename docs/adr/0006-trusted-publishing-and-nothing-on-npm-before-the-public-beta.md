# ADR 6: Trusted publishing, and nothing on npm before the public beta

- Status: Accepted
- Date: 2026-10-22

**Context.** A published version number can never be reused, and a long-lived npm token in CI is a risk.

**Decision.** Releases use npm trusted publishing (OIDC from GitHub Actions), with no `NPM_TOKEN` secret. There is no alpha phase, only a beta, and nothing goes to npm before the public beta in M6 (#117). Every package is at 3.1.0-beta.0 (Core PR #134).

**Consequences.** npm only allows a trust link on a package that exists, so at M6 the first beta is published once by hand, then `pnpm npm:trust` links the repo, then the `v3.1.0-beta.0` tag runs the release workflow. Until then the docs show how to install from tarballs built from the repo.

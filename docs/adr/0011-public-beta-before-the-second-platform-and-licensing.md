# ADR 11: The public beta ships before the second platform and licensing

- Status: Accepted
- Date: 2026-10-28

**Context.** The roadmap put the public beta (M6) after a second platform (M4) and licensing (M5). Discord support, lite mode, the prebuilt web app and the v2 migration path are done, and real users can test them now. The docs site has no host yet (ADR 9).

**Decision.** Ship the public beta, 3.1.0-beta.0, next. The second platform and the licensing work follow during the beta. Hosting the docs site is deferred: during the beta the package READMEs are the docs, with the quick start in the `asctane-dashboard` README.

**Consequences.** The beta is Discord only. ADR 1 still holds: the platform interface may still change when the second platform lands, which is allowed during a beta. Pro packages and license keys (ADR 8) arrive in a later beta. Feedback goes to GitHub issues and the support Discord.

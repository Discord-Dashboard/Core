# Architecture decisions

Each file records one decision that shapes v3: its context, what was decided and
what follows from it. Maintainers: zVapor and breftejk.

To add one, copy the layout of an existing file, take the next number, and open
a pull request. To change a decision, add a new record that supersedes the old
one rather than rewriting it.

| ADR                                                                       | Decision                                                      | Status         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------- |
| [1](0001-a-platform-neutral-core-with-one-package-per-platform.md)        | A platform-neutral core with one package per platform         | Accepted       |
| [2](0002-every-api-route-under-api.md)                                    | Every API route under `/api`                                  | Accepted       |
| [3](0003-the-web-app-ships-prebuilt-and-is-served-on-the-api-port.md)     | The web app ships prebuilt and is served on the API port      | Accepted       |
| [4](0004-new-npm-names.md)                                                | New npm names                                                 | Accepted       |
| [5](0005-v3-is-core-s-default-branch.md)                                  | `v3` is Core's default branch                                 | Accepted       |
| [6](0006-trusted-publishing-and-nothing-on-npm-before-the-public-beta.md) | Trusted publishing, and nothing on npm before the public beta | Accepted       |
| [7](0007-v2-migration-through-lite-mode-and-compat-v2.md)                 | v2 migration through lite mode and `compat-v2`                | Accepted       |
| [8](0008-open-core-licensing-with-a-closed-license-server.md)             | Open core licensing with a closed license server              | Needs breftejk |
| [9](0009-docs-on-mintlify-at-dbd-docs-assistantscenter-com.md)            | Docs on Mintlify at dbd-docs.assistantscenter.com             | Proposed       |
| [10](0010-squash-merges-conventional-commits-green-ci.md)                 | Squash merges, Conventional Commits, green CI                 | Accepted       |

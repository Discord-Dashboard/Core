# ADR 5: `v3` is Core's default branch

- Status: Accepted
- Date: 2026-10-22

**Context.** v3 lived on a side branch with unrelated history, next to several repos left over from earlier splits.

**Decision.** `v3` is the default branch of Discord-Dashboard/Core, and v2 moved to the `v2` branch (#114). The leftover repos Contracts, API, Auth, React, Form-Types and Velo-Theme are archived, with a pointer to Core (#99).

**Consequences.** New contributors land on v3, and `Closes #n` in a pull request closes the issue again. v2 fixes go to the `v2` branch.

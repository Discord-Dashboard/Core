# ADR 7: v2 migration through lite mode and `compat-v2`

- Status: Accepted
- Date: 2026-10-22

**Context.** v2 bots describe settings as an array with `getActualSet` and `setNew` callbacks per option. Asking every bot to rewrite that before trying v3 would stall adoption.

**Decision.** `@acstane/compat-v2` turns a v2 settings array into a v3 schema plus an adapter that calls the existing callbacks: `fromV2(settings, { source })`, passed to `createDashboard({ settings, adapter })`. Every v2 form type is mapped, select lists included. Bots can then move to `defineSettings` one category at a time and read values with `dash.get`. Merged as Core PR #140.

**Consequences.** v2 themes, `useUnderMaintenance` and `allowedCheck` are not carried over. Channel pickers lose their type filter until the option moves to `f.channel({ types })`. The [migration guide](https://github.com/Discord-Dashboard/Docs/blob/main/migration/from-v2.mdx) covers both routes.

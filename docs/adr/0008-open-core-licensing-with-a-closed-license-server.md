# ADR 8: Open core licensing with a closed license server

- Status: Needs breftejk
- Date: 2026-10-22

**Context.** v2 is CC BY-NC-SA 4.0 and loads its dashboard through an obfuscated online license check, so without the license server there is no dashboard. v3 is MIT. The project still wants income to support development.

**Decision.** Open core. Everything in Core stays MIT and free, including every platform, the builder and the modules. Paid features ship as separate pro packages under a commercial license. A closed-source license server with its own admin dashboard handles activations and issues signed 7-day leases. A small MIT package verifies them offline, with a grace period. Proposed tiers: Free, Supporter, Pro and Business, with one key per bot.

**Consequences.** The free dashboard never phones home or stops working. The work is M5, in the private `pro` and `license-server` repos. It needs breftejk's sign-off in writing. The payment provider (Polar or Lemon Squeezy) is still open.

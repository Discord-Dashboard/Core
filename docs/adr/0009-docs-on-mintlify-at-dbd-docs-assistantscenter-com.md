# ADR 9: Docs on Mintlify at dbd-docs.assistantscenter.com

- Status: Proposed
- Date: 2026-10-22

**Context.** The v3 docs are written and merged in [Discord-Dashboard/Docs](https://github.com/Discord-Dashboard/Docs) (Docs PR #3), in Mintlify's `docs.json` format, but nothing hosts them yet. The old address, dbd-docs.assistantscenter.com, returns Cloudflare error 522 as of 2026-10-22, and so does assistantscenter.com: the server behind it is down. The domain is on breftejk's Cloudflare account.

**Decision.** Connect a Mintlify project to the Docs repo's `main` branch, so every merge deploys and every pull request gets a preview. Keep the known address by making dbd-docs.assistantscenter.com its custom domain, with a CNAME record set to DNS only so Mintlify can issue the certificate.

| Option                                                | For                                                             | Against                                                 |
| ----------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------- |
| Mintlify on the old address (proposed)                | No rewrite, previews per pull request, readers keep the address | Needs one DNS record from breftejk                      |
| Mintlify on a new domain                              | No dependency on another Cloudflare account                     | Old links break, and there is a new address to announce |
| Rebuild on a static site (Vercel or Cloudflare Pages) | Full control, no docs vendor                                    | Every page and component rewritten                      |

**Consequences.** Whatever the old address served is replaced by the v3 docs. If v2 readers still need their docs, they need a home of their own, such as a `v2` subdomain.

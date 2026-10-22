# Security policy

## Reporting a vulnerability

Please don't open a public issue for a security problem. Report it privately
on the [Security tab](https://github.com/Discord-Dashboard/Core/security/advisories/new)
with **Report a vulnerability**. The organization's
[security policy](https://github.com/Discord-Dashboard/.github/blob/main/SECURITY.md)
covers response times and supported versions.

## Design notes

- OAuth2 uses PKCE and a state parameter. The Discord token is stored server
  side and never reaches the browser.
- Sessions use http only, same site cookies.
- State changing requests are checked against an allowed origin list.
- Rate limiting and security headers are on by default.
- Generated and user built pages are validated data, never executed code.

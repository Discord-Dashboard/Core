# Security policy

## Reporting a vulnerability

Please do not open a public issue for security problems. Email the maintainer
with the details and steps to reproduce. You will get an acknowledgement and a
fix timeline.

## Design notes

- OAuth2 uses PKCE and a state parameter. The Discord token is stored server
  side and never reaches the browser.
- Sessions use http only, same site cookies.
- State changing requests are checked against an allowed origin list.
- Rate limiting and security headers are on by default.
- Generated and user built pages are validated data, never executed code.

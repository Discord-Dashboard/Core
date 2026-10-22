# Contributing

This is a pnpm and Turborepo monorepo.

```
pnpm install
pnpm dev
```

- Packages live in `packages`, apps in `apps`, examples in `examples`.
- The protocol and schema packages are the source of truth. Change them first,
  then update the api, web and SDKs.
- Keep pull requests focused. Add tests where it makes sense.

## Releasing

Every package that is not `private` is published to npm, and they all share
one version.

1. Set the same `version` in every publishable `package.json`.
2. Run `pnpm build && pnpm smoke:pack`. It packs each package, installs the
   tarballs into an empty project and imports them, so a missing file or a
   private dependency fails here rather than for users.
3. Push a tag named after the version, for example `v3.1.0-alpha.0`.

The release workflow refuses to publish when a package version does not match
the tag. A tag with a prerelease part (`-alpha.0`, `-beta.1`, `-rc.0`)
publishes under that dist tag, so `npm install discord-dashboard` keeps giving
people the latest stable release. It needs an `NPM_TOKEN` secret from an npm
account that can publish `discord-dashboard`, `create-discord-dashboard` and
the `@discord-dashboard` scope.

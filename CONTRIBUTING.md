# Contributing

The organization's
[contributing guide](https://github.com/Discord-Dashboard/.github/blob/main/CONTRIBUTING.md)
covers finding work, pull requests and conduct. This file covers Core itself.

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
3. Push a tag named after the version, for example `v3.1.0-beta.0`.

The release workflow refuses to publish when a package version does not match
the tag. A tag with a prerelease part (`-beta.0`, `-rc.0`)
publishes under that dist tag, so `npm install asctane-dashboard` keeps giving
people the latest stable release.

The workflow publishes with npm trusted publishing, so there is no npm token
in the repo: npm checks that the publish comes from `release.yml` in this
repo, and adds provenance. Each package needs a trust link on npm for that to
work, and npm only allows one for a package that already exists. So a new
package goes out by hand once, from an npm account that can publish
`asctane-dashboard` and the `@asctane-dashboard` scope:

1. `pnpm build && pnpm smoke:pack --out .packs`
2. `npm publish .packs/<tarball> --access public --tag beta` for each new
   package (use the tag's dist tag).
3. `pnpm npm:trust` links every package to the workflow. It needs npm 11.15
   or later and 2FA on the account; `--dry-run` prints the commands.

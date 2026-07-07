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

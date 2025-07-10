```shell
# Add remotes
git remote add api           https://github.com/Discord-Dashboard/API.git
git remote add auth          https://github.com/Discord-Dashboard/Auth.git
git remote add contracts     https://github.com/Discord-Dashboard/Contracts.git
git remote add react         https://github.com/Discord-Dashboard/React.git
git remote add velo-theme    https://github.com/Discord-Dashboard/Velo-Theme.git

# Pull each repo into its own folder via subtree
git subtree add --prefix=packages/api           api        main --squash
git subtree add --prefix=packages/auth          auth       main --squash
git subtree add --prefix=packages/contracts     contracts  main --squash
git subtree add --prefix=packages/react         react      main --squash
git subtree add --prefix=packages/velo-theme    velo-theme main --squash
```
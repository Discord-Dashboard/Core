```shell
# Add remotes
git remote add api           https://github.com/Discord-Dashboard/API.git
git remote add auth          https://github.com/Discord-Dashboard/Auth.git
git remote add contracts     https://github.com/Discord-Dashboard/Contracts.git
git remote add react         https://github.com/Discord-Dashboard/React.git
git remote add velo-theme    https://github.com/Discord-Dashboard/Velo-Theme.git
git remote add form-types    https://github.com/Discord-Dashboard/Form-Types.git
```

Then everytime u want to update:

git add . && git commit -m ""

```shell
git subtree push --prefix=packages/api api main
git subtree push --prefix=packages/auth auth main
git subtree push --prefix=packages/contracts contracts main
git subtree push --prefix=packages/react react main
git subtree push --prefix=packages/velo-theme velo-theme main
git subtree push --prefix=packages/form-types form-types main
git push origin v3
```
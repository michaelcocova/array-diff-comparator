# Release

## Versioning

当前仓库使用：

- `package.json` 中的 `version`
- 根目录 `CHANGELOG.md`

版本提升命令：

```bash
pnpm bump
```

## Recommended flow

1. 修改代码
2. 运行 `pnpm test`
3. 更新 `CHANGELOG.md`
4. 执行版本命令
5. 执行 `pnpm release:dry`

## Local release

设置好 `NPM_TOKEN` 后执行：

```bash
pnpm release:dry
```

## GitHub Actions

仓库内置了以下工作流：

- `.github/workflows/release.yml`
- `.github/workflows/deploy.yml`

其中 `deploy.yml` 用于部署 `VitePress` 文档站。

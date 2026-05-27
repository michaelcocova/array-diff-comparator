# apply

`apply` 负责：

- 接收 `diffResult`
- 接收人工决议或批量决议
- 返回最终结果

## Resolve all to target

适合“传入数据优先”的同步场景：

```ts
const [applyError, result] = apply(diffResult, {
  resolveAll: "target",
});
```

这里的 `target` 就是传入数据，也就是 `incoming`。

## Resolve all to source

适合“当前数据优先”的保护场景：

```ts
const [applyError, result] = apply(diffResult, {
  resolveAll: "source",
});
```

这里的 `source` 就是当前数据，也就是 `current`。

## Field-level resolutions

适合人工逐字段决议的场景：

```ts
const [applyError, result] = apply(diffResult, {
  resolutions: [
    { key: 1, field: "name", choice: "source" },
    { key: 1, field: "age", choice: "target" },
    { key: 1, field: "city", choice: "source" },
  ],
});
```

这表示：

- `name` 采用当前值
- `age` 采用传入值
- `city` 采用当前值

## Unresolved conflicts

如果 `diffResult` 里存在冲突，但你没有给出足够的决议，`apply` 会返回：

```ts
[error, null];
```

其中 `error.type` 为：

```ts
"unresolved_conflict";
```

# customCompare

如果你不想按字段列表比较，也可以自定义整条记录比较逻辑。

## Example

```ts
const [diffError, diffResult] = diff({
  source: current,
  target: incoming,
  uniqueKey: "id",
  customCompare(sourceItem, targetItem) {
    return sourceItem.version === targetItem.version;
  },
});
```

## Notes

- `customCompare` 返回 `true` 表示这对记录没有冲突
- 返回 `false` 表示这对记录存在一条自定义冲突
- 适合版本号、一致性状态、复合业务规则等比较逻辑

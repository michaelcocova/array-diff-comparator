# Chunked Apply

结果规模很大时，不要一次性把最终结果全部放进内存，可以让 `apply` 分块输出。

## Example

```ts
const [applyError, result] = apply(diffResult, {
  resolveAll: "target",
  chunkThreshold: 50_000,
  onChunk(items) {
    console.log("收到分块结果", items.length);
  },
  onCompleted(summary) {
    console.log("完成摘要", summary);
  },
});

if (applyError) {
  throw applyError;
}

console.log(result); // null
```

## Summary

`onCompleted` 收到的摘要结构：

```ts
{
  total: number;
  chunks: number;
}
```

## When to use

当结果规模很大，不希望一次性构造完整数组时，使用分块模式。

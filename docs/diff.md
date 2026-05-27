# diff

`diff` 负责：

- 校验输入
- 基于 `uniqueKey` 建立匹配关系
- 找出冲突
- 生成一个可序列化的 `diffResult`

## Basic Example

```ts
import { diff } from "array-diff-comparator";

const current = [{ id: 1, name: "current-name", age: 18, city: "shanghai" }];
const incoming = [{ id: 1, name: "incoming-name", age: 20, city: "hangzhou" }];

const [diffError, diffResult] = diff({
  source: current,
  target: incoming,
  uniqueKey: "id",
  compareFields: ["name", "age", "city"],
});

if (diffError || !diffResult) {
  throw diffError;
}
```

## diffResult 有什么

主要包含三类信息：

- `conflicts`：需要人工处理的冲突列表
- `stats`：匹配数、冲突数、未解决冲突数等统计信息
- `sourceToTargetIndex` / `targetMatched`：给 `apply` 用的上下文数据，并且可序列化

## Params

```ts
diff({
  source,
  target,
  uniqueKey,
  compareFields,
  customCompare,
});
```

## When to use compareFields

当你只关心固定字段是否变化时，优先用 `compareFields`。

## When to use customCompare

当比较逻辑不是简单字段相等，而是整条记录的业务条件时，使用 `customCompare`。

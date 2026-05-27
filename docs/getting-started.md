# Getting Started

## Install

```bash
pnpm add array-diff-comparator
```

## Quick Start

```ts
import { apply, diff } from "array-diff-comparator";

const current = [
  { id: 1, name: "张三", age: 18, city: "shanghai" },
  { id: 2, name: "李四", age: 20, city: "hangzhou" },
];

const incoming = [
  { id: 1, name: "张三(新)", age: 19, city: "shanghai" },
  { id: 3, name: "王五", age: 22, city: "beijing" },
];

const [diffError, diffResult] = diff({
  source: current,
  target: incoming,
  uniqueKey: "id",
  compareFields: ["name", "age", "city"],
});

if (diffError || !diffResult) {
  throw diffError;
}

const [applyError, result] = apply(diffResult, {
  resolveAll: "target",
});

if (applyError || !result) {
  throw applyError;
}

console.log(result);
```

## Return shape

所有主要 API 都返回二元组：

```ts
[error, data];
```

成功时 `error` 为 `null`，失败时 `data` 为 `null`。

## Next

- 查看 [diff](/diff) 了解差异结果结构
- 查看 [apply](/apply) 了解如何处理冲突

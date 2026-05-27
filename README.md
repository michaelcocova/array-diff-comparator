# array-diff-comparator

一个面向业务流程的数组对比库。

适合这样的场景：

- 你有一份当前数据 `current`
- 又收到一份传入数据 `incoming`
- 你想先做 diff，拿到冲突
- 再由人工或服务端决定冲突怎么解决
- 最后把决议 apply 成最终结果

这个库的公开 API 只有两个：

- `diff`
- `apply`

## 设计思路

这个库不是“进程内状态机”，而是“两步协议”：

1. `diff(current, incoming)` 返回一个可序列化的 `diffResult`
2. `apply(diffResult, resolutions)` 在任何地方都能独立执行

也就是说：

- `diffResult` 可以直接 `JSON.stringify`
- 可以存数据库
- 可以走 HTTP
- 可以在另一个 Node 进程里再调用 `apply`

## 快速开始

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

## 开发

安装依赖：

```bash
vp install
```

运行测试：

```bash
vp test
```

运行检查：

```bash
vp check
```

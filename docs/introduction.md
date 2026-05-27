# Introduction

`array-diff-comparator` 是一个面向业务流程的数组对比库。

它适合这样的场景：

- 你有一份当前数据 `current`
- 又收到一份传入数据 `incoming`
- 你想先做 diff，拿到冲突
- 再由人工或服务端决定冲突怎么解决
- 最后把决议 apply 成最终结果

## What is it?

这个库的公开 API 很少，核心只有两个：

- `diff`
- `apply`

它不是进程内状态机，而是一个两步协议：

1. `diff(current, incoming)` 返回一个可序列化的 `diffResult`
2. `apply(diffResult, resolutions)` 在任何地方都可以独立执行

这意味着：

- `diffResult` 可以直接 `JSON.stringify`
- 可以存数据库
- 可以走 HTTP
- 可以在另一个 Node 进程里继续 `apply`

## Typical workflow

1. 用 `diff` 比较 `current` 和 `incoming`
2. 拿到冲突列表
3. 人工或服务端做决议
4. 用 `apply` 生成最终结果

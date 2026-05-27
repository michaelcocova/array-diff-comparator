import { expect, test } from "vite-plus/test";
import { diff } from "../src/index.ts";

test("diff：字段不同会产生未解决冲突", () => {
  const [diffError, diffResult] = diff({
    source: [{ id: 1, name: "a", v: 1 }],
    target: [{ id: 1, name: "b", v: 1 }],
    uniqueKey: "id",
    compareFields: ["name", "v"],
  });

  expect(diffError).toBeNull();
  expect(diffResult).not.toBeNull();
  expect(diffResult?.conflicts).toHaveLength(1);
  expect(diffResult?.stats.unresolvedConflictCount).toBe(1);
});

test("diff：source_only/target_only 会正确统计", () => {
  const [diffError, diffResult] = diff({
    source: [{ id: 1, name: "a" }],
    target: [{ id: 2, name: "b" }],
    uniqueKey: "id",
    compareFields: ["name"],
  });

  expect(diffError).toBeNull();
  expect(diffResult?.stats.matchedCount).toBe(0);
  expect(diffResult?.stats.sourceOnlyCount).toBe(1);
  expect(diffResult?.stats.targetOnlyCount).toBe(1);
});

test("diff：current 新增但 incoming 没有时，会统计为 sourceOnly", () => {
  const [diffError, diffResult] = diff({
    source: [
      { id: 1, name: "only-current" },
      { id: 2, name: "shared" },
    ],
    target: [{ id: 2, name: "shared" }],
    uniqueKey: "id",
    compareFields: ["name"],
  });

  expect(diffError).toBeNull();
  expect(diffResult?.stats.matchedCount).toBe(1);
  expect(diffResult?.stats.sourceOnlyCount).toBe(1);
  expect(diffResult?.stats.targetOnlyCount).toBe(0);
});

test("diff：incoming 新增但 current 没有时，会统计为 targetOnly", () => {
  const [diffError, diffResult] = diff({
    source: [{ id: 1, name: "shared" }],
    target: [
      { id: 1, name: "shared" },
      { id: 2, name: "only-incoming" },
    ],
    uniqueKey: "id",
    compareFields: ["name"],
  });

  expect(diffError).toBeNull();
  expect(diffResult?.stats.matchedCount).toBe(1);
  expect(diffResult?.stats.sourceOnlyCount).toBe(0);
  expect(diffResult?.stats.targetOnlyCount).toBe(1);
});

test("diff：customCompare 返回 false 时产生 __custom__ 冲突", () => {
  const [diffError, diffResult] = diff({
    source: [{ id: 1, name: "a" }],
    target: [{ id: 1, name: "a" }],
    uniqueKey: "id",
    customCompare: () => false,
  });

  expect(diffError).toBeNull();
  expect(diffResult?.stats.unresolvedConflictCount).toBe(1);
  expect(diffResult?.conflicts[0]?.hasCustomConflict).toBe(true);
});

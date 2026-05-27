import { expect, test } from "vite-plus/test";
import { apply, diff } from "../src/index.ts";

test("apply：未传决议时返回 unresolved_conflict", () => {
  const [, diffResult] = diff({
    source: [{ id: 1, name: "a", v: 1 }],
    target: [{ id: 1, name: "b", v: 1 }],
    uniqueKey: "id",
    compareFields: ["name", "v"],
  });

  const [applyError, result] = apply(diffResult!);
  expect(result).toBeNull();
  expect(applyError).not.toBeNull();
  expect(applyError?.type).toBe("unresolved_conflict");
});

test("apply：选择 source/target/both 后可拿到最终结果", () => {
  const [, diffResult] = diff({
    source: [{ id: 1, name: "a", v: 1 }],
    target: [{ id: 1, name: "b", v: 2 }],
    uniqueKey: "id",
    compareFields: ["name", "v"],
  });

  const [applyError, result] = apply(diffResult!, {
    resolutions: [
      { key: 1, field: "name", choice: "source" },
      { key: 1, field: "v", choice: "target" },
    ],
  });

  expect(applyError).toBeNull();
  expect(result).toEqual([{ id: 1, name: "a", v: 2, result: { id: 1, name: "a", v: 2 } }]);

  const [, diffResult2] = diff({
    source: [{ id: 1, name: "a", v: 1 }],
    target: [{ id: 1, name: "b", v: 2 }],
    uniqueKey: "id",
    compareFields: ["name"],
  });
  const [, result2] = apply(diffResult2!, {
    resolutions: [{ key: 1, field: "name", choice: "both" }],
  });

  expect(result2).toEqual([
    {
      id: 1,
      name: { source: "a", target: "b" },
      v: 2,
      result: { id: 1, name: { source: "a", target: "b" }, v: 2 },
    },
  ]);
});

test("apply：source_only/target_only 仍输出 result", () => {
  const [, diffResult] = diff({
    source: [{ id: 1, name: "a" }],
    target: [{ id: 2, name: "b" }],
    uniqueKey: "id",
    compareFields: ["name"],
  });

  const [applyError, result] = apply(diffResult!);
  expect(applyError).toBeNull();
  expect(result).toEqual([
    { id: 1, name: "a", result: { id: 1, name: "a" } },
    { id: 2, name: "b", result: { id: 2, name: "b" } },
  ]);
});

test("apply：可批量解决所有冲突", () => {
  const [, diffResult] = diff({
    source: [{ id: 1, name: "a", v: 1 }],
    target: [{ id: 1, name: "b", v: 2 }],
    uniqueKey: "id",
    compareFields: ["name", "v"],
  });

  const [applyError, result] = apply(diffResult!, {
    resolveAll: "target",
  });
  expect(applyError).toBeNull();
  expect(result).toEqual([{ id: 1, name: "b", v: 2, result: { id: 1, name: "b", v: 2 } }]);
});

test("冲突解决：全部采用传入", () => {
  const incoming = { id: 1, name: "incoming", age: 20, city: "hangzhou" };
  const current = { id: 1, name: "current", age: 18, city: "shanghai" };

  const [, diffResult] = diff({
    source: [current],
    target: [incoming],
    uniqueKey: "id",
    compareFields: ["name", "age", "city"],
  });

  const [applyError, result] = apply(diffResult!, {
    resolveAll: "target",
  });

  expect(applyError).toBeNull();
  expect(result).toEqual([
    {
      id: 1,
      name: "incoming",
      age: 20,
      city: "hangzhou",
      result: { id: 1, name: "incoming", age: 20, city: "hangzhou" },
    },
  ]);
});

test("冲突解决：全部采用当前", () => {
  const incoming = { id: 1, name: "incoming", age: 20, city: "hangzhou" };
  const current = { id: 1, name: "current", age: 18, city: "shanghai" };

  const [, diffResult] = diff({
    source: [current],
    target: [incoming],
    uniqueKey: "id",
    compareFields: ["name", "age", "city"],
  });

  const [applyError, result] = apply(diffResult!, {
    resolveAll: "source",
  });

  expect(applyError).toBeNull();
  expect(result).toEqual([
    {
      id: 1,
      name: "current",
      age: 18,
      city: "shanghai",
      result: { id: 1, name: "current", age: 18, city: "shanghai" },
    },
  ]);
});

test("冲突解决：部分当前，部分传入", () => {
  const incoming = { id: 1, name: "incoming", age: 20, city: "hangzhou" };
  const current = { id: 1, name: "current", age: 18, city: "shanghai" };

  const [, diffResult] = diff({
    source: [current],
    target: [incoming],
    uniqueKey: "id",
    compareFields: ["name", "age", "city"],
  });

  const [applyError, result] = apply(diffResult!, {
    resolutions: [
      { key: 1, field: "name", choice: "source" },
      { key: 1, field: "age", choice: "target" },
      { key: 1, field: "city", choice: "source" },
    ],
  });

  expect(applyError).toBeNull();
  expect(result).toEqual([
    {
      id: 1,
      name: "current",
      age: 20,
      city: "shanghai",
      result: { id: 1, name: "current", age: 20, city: "shanghai" },
    },
  ]);
});

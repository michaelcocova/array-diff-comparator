import { expect, test } from "vite-plus/test";
import { apply, diff } from "../src/index.ts";

test("apply：超过阈值时按块输出，并在结束后回调 onCompleted", () => {
  const [, diffResult] = diff({
    source: [
      { id: 1, name: "a" },
      { id: 2, name: "b" },
    ],
    target: [
      { id: 1, name: "x" },
      { id: 3, name: "c" },
    ],
    uniqueKey: "id",
    compareFields: ["name"],
  });

  const chunks: Array<Array<{ id: number; name: string; result: { id: number; name: string } }>> =
    [];
  let completed: { total: number; chunks: number } | null = null;
  const [applyError, result] = apply(diffResult!, {
    resolveAll: "target",
    chunkThreshold: 2,
    onChunk(items) {
      chunks.push(
        items as Array<{ id: number; name: string; result: { id: number; name: string } }>,
      );
    },
    onCompleted(summary) {
      completed = summary;
    },
  });

  expect(applyError).toBeNull();
  expect(result).toBeNull();
  expect(completed).toEqual({ total: 3, chunks: 2 });
  expect(chunks.flat()).toEqual([
    { id: 1, name: "x", result: { id: 1, name: "x" } },
    { id: 2, name: "b", result: { id: 2, name: "b" } },
    { id: 3, name: "c", result: { id: 3, name: "c" } },
  ]);
});

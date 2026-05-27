import { expect, test } from "vite-plus/test";
import { apply, diff } from "../src/index.ts";
import { generateLargeJsonData, generateTargetData } from "./utils/dataGenerator.ts";

function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(3)} s (${ms.toFixed(3)} ms)`;
}

// 1w
// const PERF_COUNT = 10_000;
// 10w
// const PERF_COUNT = 100_000;
// 100w
const PERF_COUNT: number = 1_000_000;

const PERF_MODIFY_RATE = 0.3;
const PERF_CHUNK_THRESHOLD = 50_000;

test("perf", () => {
  const count = PERF_COUNT;
  const modifyRate = PERF_MODIFY_RATE;

  const source = generateLargeJsonData(count, 1);
  const target = generateTargetData(source, modifyRate);

  const heapBefore = process.memoryUsage().heapUsed;

  const diffStart = process.hrtime.bigint();
  const [diffError, diffResult] = diff({
    source,
    target,
    uniqueKey: "id",
    compareFields: ["name", "age", "score"],
  });
  const diffEnd = process.hrtime.bigint();

  expect(diffError).toBeNull();

  const applyStart = process.hrtime.bigint();
  let completedSummary: { total: number; chunks: number } | null = null;
  let received = 0;
  const [applyError, result] = apply(diffResult!, {
    resolveAll: "target",
    chunkThreshold: PERF_CHUNK_THRESHOLD,
    onChunk(items) {
      received += items.length;
    },
    onCompleted(summary) {
      completedSummary = summary;
    },
  });
  const applyEnd = process.hrtime.bigint();

  expect(applyError).toBeNull();
  expect(result).toBeNull();
  expect(completedSummary).not.toBeNull();
  expect(completedSummary!.total).toBe(count);
  expect(received).toBe(count);

  const heapAfter = process.memoryUsage().heapUsed;

  const diffMs = Number(diffEnd - diffStart) / 1_000_000;
  const applyMs = Number(applyEnd - applyStart) / 1_000_000;
  const totalMs = Number(applyEnd - diffStart) / 1_000_000;
  const heapDeltaMb = (heapAfter - heapBefore) / 1024 / 1024;

  console.log(
    JSON.stringify(
      {
        总条数: count,
        修改比例: modifyRate,
        Diff耗时: formatDuration(diffMs),
        Apply耗时: formatDuration(applyMs),
        总耗时: formatDuration(totalMs),
        分块阈值: PERF_CHUNK_THRESHOLD,
        分块完成摘要: completedSummary,
        单条平均耗时微秒: (totalMs * 1000) / count,
        堆内存增量MB: heapDeltaMb,
      },
      null,
      2,
    ),
  );
}, 600_000);

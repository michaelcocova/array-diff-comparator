import type { ArrayDiffError } from "./error.ts";

/**
 * 对外公开的数据结构定义。
 */
export type ConflictChoice = "source" | "target" | "both";

/**
 * 自定义整条记录的比较函数。
 */
export type CompareFn<T extends Record<string, unknown>> = (
  sourceItem: T,
  targetItem: T,
) => boolean;

/**
 * 同一字段在 source 与 target 中的取值对。
 */
export type DiffPair<V> = { source: V; target: V };

/**
 * `diff()` 阶段的入参。
 */
export type DiffParams<T extends Record<string, unknown>> = {
  source: T[];
  target: T[];
  uniqueKey: keyof T & string;
  compareFields?: (keyof T & string)[];
  customCompare?: CompareFn<T>;
};

/**
 * 一条 source 记录与一条 target 记录之间识别出的冲突信息。
 */
export type DiffConflict = {
  key: string | number;
  sourceIndex: number;
  targetIndex: number;
  fields: string[];
  hasCustomConflict?: boolean;
};

/**
 * `diff()` 产出的汇总统计信息。
 */
export type DiffStats = {
  sourceCount: number;
  targetCount: number;
  matchedCount: number;
  sourceOnlyCount: number;
  targetOnlyCount: number;
  conflictCount: number;
  unresolvedConflictCount: number;
};

/**
 * `diff()` 的可序列化输出，同时也是 `apply()` 的输入。
 */
export type DiffResult<T extends Record<string, unknown>> = {
  uniqueKey: keyof T & string;
  source: T[];
  target: T[];
  sourceToTargetIndex: number[];
  targetMatched: number[];
  conflicts: DiffConflict[];
  stats: DiffStats;
};

/**
 * 一条冲突字段的解决决议。
 */
export type Resolution = {
  key: string | number;
  field: string;
  choice: ConflictChoice;
};

/**
 * 分块 apply 完成后的摘要信息。
 */
export type ApplySummary = {
  total: number;
  chunks: number;
};

/**
 * `apply()` 阶段的可选配置。
 */
export type ApplyOptions<T extends Record<string, unknown>> = {
  resolutions?: Resolution[];
  resolveAll?: ConflictChoice;
  chunkThreshold?: number;
  onChunk?: (items: Array<T & { result: T }>) => void;
  onCompleted?: (summary: ApplySummary) => void;
};

export type ResultTuple<T> = [ArrayDiffError | null, T | null];

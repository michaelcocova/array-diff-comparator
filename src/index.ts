/**
 * API
 * - `diff()` 负责生成可序列化差异结果，
 * - `apply()` 负责基于决议输出最终合并结果。
 */
export type {
  ApplyOptions,
  ApplySummary,
  CompareFn,
  ConflictChoice,
  DiffConflict,
  DiffPair,
  DiffParams,
  DiffResult,
  DiffStats,
  Resolution,
} from "./types.ts";

import { ArrayDiffError } from "./error.ts";
import type {
  ApplyOptions,
  ApplySummary,
  DiffConflict,
  DiffPair,
  DiffParams,
  DiffResult,
  ResultTuple,
} from "./types.ts";

import { applyChoice, isObjectRecord, toKeyStringOrNumber } from "./utils.ts";

/**
 * 为 target 构建基于 uniqueKey 的索引，并校验 key 唯一性。
 */
function buildTargetIndexMap<T extends Record<string, unknown>>(
  target: T[],
  uniqueKey: keyof T & string,
): ResultTuple<Map<string | number, number>> {
  const targetIndexMap = new Map<string | number, number>();

  for (let index = 0; index < target.length; index++) {
    const item = target[index];
    if (!isObjectRecord(item)) {
      return [new ArrayDiffError("target 内元素必须为对象", "invalid_input"), null];
    }

    const keyValue = toKeyStringOrNumber(item[uniqueKey]);
    if (keyValue === null) {
      return [
        new ArrayDiffError(
          `target 内元素 uniqueKey=${String(uniqueKey)} 必须为 string 或 number`,
          "invalid_input",
        ),
        null,
      ];
    }

    if (targetIndexMap.has(keyValue)) {
      return [
        new ArrayDiffError(
          `target 内 uniqueKey=${String(uniqueKey)} 存在重复值：${String(keyValue)}`,
          "duplicate_key",
        ),
        null,
      ];
    }

    targetIndexMap.set(keyValue, index);
  }

  return [null, targetIndexMap];
}

/**
 * 将 `resolveAll` 与手动 `resolutions` 合并成统一的决议映射。
 */
function buildResolutionMap<T extends Record<string, unknown>>(
  diffResult: DiffResult<T>,
  options?: ApplyOptions<T>,
): ResultTuple<Map<string | number, Partial<Record<string, "source" | "target" | "both">>>> {
  const resolutions = new Map<
    string | number,
    Partial<Record<string, "source" | "target" | "both">>
  >();

  if (options?.resolveAll) {
    for (const conflict of diffResult.conflicts) {
      const record: Partial<Record<string, "source" | "target" | "both">> = {};
      for (const field of conflict.fields) {
        record[field] = options.resolveAll;
      }
      if (conflict.hasCustomConflict) {
        record.__custom__ = options.resolveAll;
      }
      resolutions.set(conflict.key, record);
    }
  }

  if (options?.resolutions) {
    if (!Array.isArray(options.resolutions)) {
      return [new ArrayDiffError("resolutions 必须为数组", "invalid_input"), null];
    }

    const conflictMap = new Map<string | number, DiffConflict>();
    for (const conflict of diffResult.conflicts) {
      conflictMap.set(conflict.key, conflict);
    }

    for (const item of options.resolutions) {
      const conflict = conflictMap.get(item.key);
      if (!conflict) {
        continue;
      }

      const exists =
        item.field === "__custom__"
          ? Boolean(conflict.hasCustomConflict)
          : conflict.fields.includes(item.field);
      if (!exists) {
        continue;
      }

      const record = resolutions.get(item.key) ?? {};
      record[item.field] = item.choice;
      resolutions.set(item.key, record);
    }
  }

  return [null, resolutions];
}

/**
 * 统计当前 diffResult 中还有多少冲突字段尚未解决。
 */
function countUnresolved<T extends Record<string, unknown>>(
  diffResult: DiffResult<T>,
  resolutions: Map<string | number, Partial<Record<string, "source" | "target" | "both">>>,
): number {
  let unresolved = 0;

  for (const conflict of diffResult.conflicts) {
    const record = resolutions.get(conflict.key);

    for (const field of conflict.fields) {
      if (!record?.[field]) {
        unresolved++;
      }
    }

    if (conflict.hasCustomConflict && !record?.__custom__) {
      unresolved++;
    }
  }

  return unresolved;
}

/**
 * 为一对已匹配记录构造最终输出项。
 */
function buildResultItem<T extends Record<string, unknown>>(
  sourceItem: T,
  targetItem: T,
  conflict: DiffConflict | undefined,
  resolutions: Map<string | number, Partial<Record<string, "source" | "target" | "both">>>,
): T & { result: T } {
  if (!conflict) {
    const result = targetItem;
    return Object.assign({ result }, result) as T & { result: T };
  }

  const record = resolutions.get(conflict.key);
  if (!record) {
    const result = targetItem;
    return Object.assign({ result }, result) as T & { result: T };
  }

  let useTarget = true;
  for (const field of conflict.fields) {
    if (record[field] !== "target") {
      useTarget = false;
      break;
    }
  }

  if (useTarget) {
    const result = targetItem;
    return Object.assign({ result }, result) as T & { result: T };
  }

  const result = { ...targetItem } as T;
  for (const field of conflict.fields) {
    const choice = record[field];
    if (!choice || choice === "target") {
      continue;
    }

    result[field as keyof T] = applyChoice(
      {
        source: sourceItem[field as keyof T],
        target: targetItem[field as keyof T],
      } as DiffPair<T[keyof T]>,
      choice,
    ) as T[keyof T];
  }

  return Object.assign({ result }, result) as T & { result: T };
}

/**
 * 在分块模式下逐批输出结果，降低一次性构造超大数组的内存压力。
 */
function applyInChunks<T extends Record<string, unknown>>(
  diffResult: DiffResult<T>,
  resolutions: Map<string | number, Partial<Record<string, "source" | "target" | "both">>>,
  chunkThreshold: number,
  onChunk: (items: Array<T & { result: T }>) => void,
): ApplySummary {
  const conflictBySourceIndex = new Map<number, DiffConflict>();
  const chunk: Array<T & { result: T }> = [];
  let total = 0;
  let chunks = 0;

  for (const conflict of diffResult.conflicts) {
    conflictBySourceIndex.set(conflict.sourceIndex, conflict);
  }

  const flush = () => {
    if (chunk.length === 0) {
      return;
    }
    onChunk(chunk.splice(0, chunk.length));
    chunks++;
  };

  for (let sourceIndex = 0; sourceIndex < diffResult.source.length; sourceIndex++) {
    const sourceItem = diffResult.source[sourceIndex];
    const targetIndex = diffResult.sourceToTargetIndex[sourceIndex];

    if (targetIndex < 0) {
      const result = sourceItem;
      chunk.push(Object.assign({ result }, result) as T & { result: T });
    } else {
      const targetItem = diffResult.target[targetIndex];
      chunk.push(
        buildResultItem(
          sourceItem,
          targetItem,
          conflictBySourceIndex.get(sourceIndex),
          resolutions,
        ),
      );
    }

    total++;
    if (chunk.length >= chunkThreshold) {
      flush();
    }
  }

  for (let targetIndex = 0; targetIndex < diffResult.target.length; targetIndex++) {
    if (diffResult.targetMatched[targetIndex] === 1) {
      continue;
    }
    const result = diffResult.target[targetIndex];
    chunk.push(Object.assign({ result }, result) as T & { result: T });
    total++;
    if (chunk.length >= chunkThreshold) {
      flush();
    }
  }

  flush();
  return { total, chunks };
}

/**
 * 执行数组差异计算，返回可序列化的 diffResult。
 */
export function diff<T extends Record<string, unknown>>(
  params: DiffParams<T>,
): ResultTuple<DiffResult<T>> {
  if (!Array.isArray(params.source) || !Array.isArray(params.target)) {
    return [new ArrayDiffError("source/target 必须为数组", "invalid_input"), null];
  }
  if (typeof params.uniqueKey !== "string" || params.uniqueKey.length === 0) {
    return [new ArrayDiffError("uniqueKey 必须为非空字符串", "invalid_input"), null];
  }
  if (params.compareFields && !Array.isArray(params.compareFields)) {
    return [new ArrayDiffError("compareFields 必须为字符串数组", "invalid_input"), null];
  }
  if (params.customCompare && typeof params.customCompare !== "function") {
    return [new ArrayDiffError("customCompare 必须为函数", "invalid_input"), null];
  }

  const sourceKeys = new Set<string | number>();
  for (const item of params.source) {
    if (!isObjectRecord(item)) {
      return [new ArrayDiffError("source 内元素必须为对象", "invalid_input"), null];
    }

    const keyValue = toKeyStringOrNumber(item[params.uniqueKey]);
    if (keyValue === null) {
      return [
        new ArrayDiffError(
          `source 内元素 uniqueKey=${String(params.uniqueKey)} 必须为 string 或 number`,
          "invalid_input",
        ),
        null,
      ];
    }
    if (sourceKeys.has(keyValue)) {
      return [
        new ArrayDiffError(
          `source 内 uniqueKey=${String(params.uniqueKey)} 存在重复值：${String(keyValue)}`,
          "duplicate_key",
        ),
        null,
      ];
    }

    sourceKeys.add(keyValue);
  }

  const [targetIndexError, targetIndexMap] = buildTargetIndexMap(params.target, params.uniqueKey);
  if (targetIndexError || !targetIndexMap) {
    return [targetIndexError, null];
  }

  const sourceToTargetIndex = new Int32Array(params.source.length);
  sourceToTargetIndex.fill(-1);
  const targetMatched = new Uint8Array(params.target.length);
  const conflicts: DiffConflict[] = [];
  let matchedCount = 0;
  let sourceOnlyCount = 0;
  let unresolvedConflictCount = 0;

  for (let sourceIndex = 0; sourceIndex < params.source.length; sourceIndex++) {
    const sourceItem = params.source[sourceIndex];
    const key = toKeyStringOrNumber(sourceItem[params.uniqueKey]);
    if (key === null) {
      continue;
    }

    const targetIndex = targetIndexMap.get(key);
    if (targetIndex === undefined) {
      sourceOnlyCount++;
      continue;
    }

    matchedCount++;
    sourceToTargetIndex[sourceIndex] = targetIndex;
    targetMatched[targetIndex] = 1;
    const targetItem = params.target[targetIndex];
    const fields: string[] = [];
    let hasCustomConflict = false;

    if (params.compareFields && params.compareFields.length > 0) {
      for (const field of params.compareFields) {
        if (sourceItem[field] === targetItem[field]) {
          continue;
        }
        fields.push(field);
        unresolvedConflictCount++;
      }
    } else if (params.customCompare && !params.customCompare(sourceItem, targetItem)) {
      hasCustomConflict = true;
      unresolvedConflictCount++;
    }

    if (fields.length > 0 || hasCustomConflict) {
      conflicts.push({
        key,
        sourceIndex,
        targetIndex,
        fields,
        hasCustomConflict,
      });
    }
  }

  return [
    null,
    {
      uniqueKey: params.uniqueKey,
      source: params.source,
      target: params.target,
      sourceToTargetIndex: Array.from(sourceToTargetIndex),
      targetMatched: Array.from(targetMatched),
      conflicts,
      stats: {
        sourceCount: params.source.length,
        targetCount: params.target.length,
        matchedCount,
        sourceOnlyCount,
        targetOnlyCount: params.target.length - matchedCount,
        conflictCount: conflicts.length,
        unresolvedConflictCount,
      },
    },
  ];
}

/**
 * 基于 diffResult 与冲突决议生成最终结果。
 */
export function apply<T extends Record<string, unknown>>(
  diffResult: DiffResult<T>,
  options?: ApplyOptions<T>,
): ResultTuple<Array<T & { result: T }>> {
  const [resolutionError, resolutions] = buildResolutionMap(diffResult, options);
  if (resolutionError || !resolutions) {
    return [resolutionError, null];
  }

  const unresolved = countUnresolved(diffResult, resolutions);
  if (unresolved > 0) {
    return [
      new ArrayDiffError(`存在未解决的冲突字段：${unresolved} 个`, "unresolved_conflict"),
      null,
    ];
  }

  if (options?.chunkThreshold !== undefined || options?.onChunk || options?.onCompleted) {
    if (typeof options?.chunkThreshold !== "number" || options.chunkThreshold <= 0) {
      return [new ArrayDiffError("chunkThreshold 必须为正数", "invalid_input"), null];
    }
    if (typeof options.onChunk !== "function") {
      return [new ArrayDiffError("onChunk 必须为函数", "invalid_input"), null];
    }

    const summary = applyInChunks(diffResult, resolutions, options.chunkThreshold, options.onChunk);
    options.onCompleted?.(summary);
    return [null, null];
  }

  const conflictIndexBySourceIndex = Array.from({ length: diffResult.source.length }, () => -1);
  for (let index = 0; index < diffResult.conflicts.length; index++) {
    conflictIndexBySourceIndex[diffResult.conflicts[index].sourceIndex] = index;
  }

  const out: Array<T & { result: T }> = Array.from({
    length: diffResult.source.length + diffResult.stats.targetOnlyCount,
  });
  let outIndex = 0;

  for (let sourceIndex = 0; sourceIndex < diffResult.source.length; sourceIndex++) {
    const sourceItem = diffResult.source[sourceIndex];
    const targetIndex = diffResult.sourceToTargetIndex[sourceIndex];

    if (targetIndex < 0) {
      const result = sourceItem;
      out[outIndex++] = Object.assign({ result }, result) as T & { result: T };
      continue;
    }

    const targetItem = diffResult.target[targetIndex];
    const conflictIndex = conflictIndexBySourceIndex[sourceIndex];
    out[outIndex++] = buildResultItem(
      sourceItem,
      targetItem,
      conflictIndex >= 0 ? diffResult.conflicts[conflictIndex] : undefined,
      resolutions,
    );
  }

  for (let targetIndex = 0; targetIndex < diffResult.target.length; targetIndex++) {
    if (diffResult.targetMatched[targetIndex] === 1) {
      continue;
    }
    const result = diffResult.target[targetIndex];
    out[outIndex++] = Object.assign({ result }, result) as T & { result: T };
  }

  out.length = outIndex;
  return [null, out];
}

/**
 * `diff()` 的语义化别名。
 */
export const diffArrays = diff;
/**
 * `apply()` 的语义化别名。
 */
export const applyDiffResult = apply;

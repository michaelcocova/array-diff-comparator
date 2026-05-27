/**
 * 内部复用的通用工具函数。
 */
import type { ConflictChoice, DiffPair } from "./types.ts";

/**
 * 判断传入值是否为普通对象。
 */
export function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 将 uniqueKey 的值收敛为可作为 Map key 使用的类型。
 */
export function toKeyStringOrNumber(value: unknown): string | number | null {
  if (typeof value === "string" || typeof value === "number") return value;
  return null;
}

/**
 * 根据冲突决议返回最终字段值。
 */
export function applyChoice<V>(pair: DiffPair<V>, choice: ConflictChoice): V | DiffPair<V> {
  if (choice === "source") return pair.source;
  if (choice === "target") return pair.target;
  return pair;
}

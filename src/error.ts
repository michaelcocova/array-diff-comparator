/**
 * 库内部统一错误类型。
 */
export class ArrayDiffError extends Error {
  readonly type: string;

  constructor(message: string, type: string) {
    super(message);
    this.type = type;
  }
}

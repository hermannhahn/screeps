/**
 * Utils Tool
 * Lightweight replacements for common lodash functions to save CPU.
 */
export default class ToolUtils {
  /**
   * Simple array check to replace _.isEmpty()
   */
  public static isEmpty(array: any[] | undefined): boolean {
    return !array || array.length === 0;
  }

  /**
   * Example: find object with minimum property value (replaces _.minBy)
   */
  public static minBy<T>(array: T[], key: keyof T): T | undefined {
    if (this.isEmpty(array)) return undefined;
    return array.reduce((prev, curr) => (prev[key] < curr[key] ? prev : curr));
  }
}

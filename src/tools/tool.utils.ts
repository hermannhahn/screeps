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

  /**
   * Checks if a position is safe from enemies (hostile creeps or structures).
   */
  public static isSafe(pos: RoomPosition, range: number): boolean {
    const hostiles = pos.findInRange(FIND_HOSTILE_CREEPS, range);
    if (hostiles.length > 0) return false;

    const hostileStructures = pos.findInRange(FIND_HOSTILE_STRUCTURES, range);
    if (hostileStructures.length > 0) return false;

    return true;
  }

  /**
   * Returns a list of sources that are safe from enemies within a 10-block range.
   */
  public static getSafeSources(room: Room): Source[] {
    return room.find(FIND_SOURCES).filter(source => this.isSafe(source.pos, 10));
  }
}

import CreepLogic from "../creeps/creep.logic";
import ToolUtils from "../tools/tool.utils";

/**
 * Task: Repair
 * Pure execution of structure repairs.
 * Does NOT search for new targets.
 */
export default class TaskRepair {
  public static run(creep: Creep): void {
    // SAFETY: Do not repair if enemies are nearby (3-block range)
    if (!ToolUtils.isSafe(creep.pos, 3)) {
      creep.memory.targetId = undefined;
      return;
    }

    const targetId = creep.memory.targetId as Id<Structure>;
    const target = Game.getObjectById(targetId);

    // 1. Validation: If target is gone or fully repaired, clear memory and stop
    if (!target || target.hits === target.hitsMax) {
      creep.memory.targetId = undefined;
      return;
    }

    // 2. Execution: Only clear targetId on terminal errors
    const result = creep.repair(target);

    if (result === ERR_NOT_IN_RANGE) {
      CreepLogic.moveTo(creep, target);
    } else if (result !== OK && result !== ERR_BUSY && result !== ERR_TIRED) {
      creep.memory.targetId = undefined;
    }
  }
}

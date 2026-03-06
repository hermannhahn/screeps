import CreepLogic from "../creeps/creep.logic";
import ToolUtils from "../tools/tool.utils";

/**
 * Task: Collect
 * Pure execution of energy collection (Drops, Containers, Storage).
 */
export default class TaskCollect {
  public static run(creep: Creep): void {
    // SAFETY: Do not collect if enemies are nearby (3-block range)
    if (!ToolUtils.isSafe(creep.pos, 3)) {
      creep.memory.targetId = undefined;
      return;
    }

    const targetId = creep.memory.targetId as Id<Resource | StructureContainer | StructureStorage>;
    const target = Game.getObjectById(targetId);

    if (!target) {
      creep.memory.targetId = undefined;
      return;
    }

    if (target instanceof Resource) {
      if (target.amount === 0) {
        creep.memory.targetId = undefined;
        return;
      }
    } else if (target instanceof StructureContainer || target instanceof StructureStorage) {
      if (target.store[RESOURCE_ENERGY] === 0) {
        creep.memory.targetId = undefined;
        return;
      }
    }

    const action = (target instanceof Resource) ? creep.pickup(target) : creep.withdraw(target, RESOURCE_ENERGY);
    
    if (action === ERR_NOT_IN_RANGE) {
      CreepLogic.moveTo(creep, target);
    } else if (action !== OK && action !== ERR_BUSY && action !== ERR_TIRED) {
      creep.memory.targetId = undefined;
    }
  }
}

import CreepLogic from "../creeps/creep.logic";
import ToolUtils from "../tools/tool.utils";

/**
 * Task: Deliver
 * Pure execution of energy delivery (Spawns, Extensions, Towers, Containers, Storage).
 */
export default class TaskDeliver {
  public static run(creep: Creep): void {
    // SAFETY: Do not deliver if enemies are nearby (3-block range)
    if (!ToolUtils.isSafe(creep.pos, 3)) {
      creep.memory.targetId = undefined;
      return;
    }

    const targetId = creep.memory.targetId as Id<StructureSpawn | StructureExtension | StructureTower | StructureContainer | StructureStorage>;
    const target = Game.getObjectById(targetId);

    if (!target || !('store' in target) || target.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.targetId = undefined;
      return;
    }

    const result = creep.transfer(target, RESOURCE_ENERGY);

    if (result === ERR_NOT_IN_RANGE) {
      CreepLogic.moveTo(creep, target);
    } else if (result !== OK && result !== ERR_BUSY && result !== ERR_TIRED) {
      creep.memory.targetId = undefined;
    }
  }
}

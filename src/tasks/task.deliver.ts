import CreepLogic from "../creeps/creep.logic";

/**
 * Task: Deliver
 * Pure execution of energy delivery (Spawns, Extensions, Towers).
 * Does NOT search for new targets.
 */
export default class TaskDeliver {
  public static run(creep: Creep): void {
    const targetId = creep.memory.targetId as Id<StructureSpawn | StructureExtension | StructureTower>;
    const target = Game.getObjectById(targetId);

    // 1. Validation: If target is gone, invalid, or full, clear memory and stop
    if (!target || !('store' in target) || target.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.targetId = undefined;
      return;
    }

    // 2. Execution: Only clear targetId on terminal errors (impossible action)
    const result = creep.transfer(target, RESOURCE_ENERGY);

    if (result === ERR_NOT_IN_RANGE) {
      CreepLogic.moveTo(creep, target);
    } else if (result !== OK && result !== ERR_BUSY && result !== ERR_TIRED) {
      // Terminal errors: ERR_NOT_OWNER, ERR_INVALID_TARGET, ERR_FULL, etc.
      // Movement errors or "busy" should NOT clear the target.
      creep.memory.targetId = undefined;
    }
  }
}

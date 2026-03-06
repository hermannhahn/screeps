import CreepLogic from "../creeps/creep.logic";

/**
 * Task: Collect
 * Pure execution of energy collection (Drops or Containers).
 * Does NOT search for new targets.
 */
export default class TaskCollect {
  public static run(creep: Creep): void {
    const targetId = creep.memory.targetId as Id<Resource | StructureContainer>;
    const target = Game.getObjectById(targetId);

    // 1. Validation: If target is gone or invalid, clear memory and stop
    if (!target) {
      creep.memory.targetId = undefined;
      return;
    }

    // 2. Specific Validation: If target is empty, clear memory
    if (target instanceof Resource) {
      if (target.amount === 0) {
        creep.memory.targetId = undefined;
        return;
      }
    } else if (target instanceof StructureContainer) {
      if (target.store[RESOURCE_ENERGY] === 0) {
        creep.memory.targetId = undefined;
        return;
      }
    }

    // 3. Execution: Only clear targetId on terminal errors (impossible action)
    const action = (target instanceof Resource) ? creep.pickup(target) : creep.withdraw(target, RESOURCE_ENERGY);
    
    if (action === ERR_NOT_IN_RANGE) {
      CreepLogic.moveTo(creep, target);
    } else if (action !== OK && action !== ERR_BUSY && action !== ERR_TIRED) {
      // Terminal errors: ERR_NOT_OWNER, ERR_INVALID_TARGET, ERR_FULL, etc.
      // Movement errors or "busy" should NOT clear the target.
      creep.memory.targetId = undefined;
    }
  }
}

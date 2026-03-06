import CreepLogic from "../creeps/creep.logic";

/**
 * Task: Build
 * Pure execution of construction sites.
 * Does NOT search for new sites.
 */
export default class TaskBuild {
  public static run(creep: Creep): void {
    const targetId = creep.memory.targetId as Id<ConstructionSite>;
    const target = Game.getObjectById(targetId);

    // 1. Validation: If target is gone, clear memory and stop
    if (!target) {
      creep.memory.targetId = undefined;
      return;
    }

    // 2. Execution: Only clear targetId on terminal errors
    const result = creep.build(target);

    if (result === ERR_NOT_IN_RANGE) {
      CreepLogic.moveTo(creep, target);
    } else if (result !== OK && result !== ERR_BUSY && result !== ERR_TIRED) {
      creep.memory.targetId = undefined;
    }
  }
}

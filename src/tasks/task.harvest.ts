import CreepLogic from "../creeps/creep.logic";

/**
 * Task: Harvest
 * Pure execution of harvesting.
 * Does NOT search for new sources.
 */
export default class TaskHarvest {
  public static run(creep: Creep): void {
    const sourceId = creep.memory.targetId as Id<Source>;
    const source = Game.getObjectById(sourceId);

    // 1. Validation: If source is gone, or empty, clear memory and stop
    if (!source || source.energy === 0) {
      creep.memory.targetId = undefined;
      return;
    }

    // 2. Execution: Only clear targetId on terminal errors (impossible action)
    const result = creep.harvest(source);

    if (result === ERR_NOT_IN_RANGE) {
      CreepLogic.moveTo(creep, source);
    } else if (result !== OK && result !== ERR_BUSY && result !== ERR_TIRED) {
      // Terminal errors like ERR_NOT_FOUND, ERR_NO_BODYPART, etc.
      // Movement errors or "busy" should NOT clear the target.
      creep.memory.targetId = undefined;
    }
  }
}

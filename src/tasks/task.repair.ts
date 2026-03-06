import CreepLogic from "../creeps/creep.logic";

/**
 * Task: Repair
 * Persistent repair logic.
 */
export default class TaskRepair {
  public static run(creep: Creep): void {
    let targetId = creep.memory.targetId as Id<Structure>;
    let target = Game.getObjectById(targetId);

    // Clear target if fully repaired, gone, or high threshold reached
    if (!target || target.hits === target.hitsMax) {
      creep.memory.targetId = undefined;

      const newTarget = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (s) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL
      });

      if (newTarget) {
        targetId = newTarget.id;
        target = newTarget;
        creep.memory.targetId = targetId;
      }
    }

    if (target) {
      if (creep.repair(target) === ERR_NOT_IN_RANGE) {
        CreepLogic.moveTo(creep, target);
      }
    }
  }
}

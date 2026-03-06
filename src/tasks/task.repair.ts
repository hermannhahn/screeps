import CreepLogic from "../creeps/creep.logic";

/**
 * Task: Repair
 * Finds damaged structures and repairs them.
 */
export default class TaskRepair {
  public static run(creep: Creep): void {
    const target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (s) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL
    });

    if (target) {
      if (creep.repair(target) === ERR_NOT_IN_RANGE) {
        CreepLogic.moveTo(creep, target);
      }
    }
  }
}

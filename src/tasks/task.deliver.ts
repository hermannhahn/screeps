import CreepLogic from "../creeps/creep.logic";

/**
 * Task: Deliver
 * Delivers energy to Spawns, Extensions, or Towers.
 */
export default class TaskDeliver {
  public static run(creep: Creep): void {
    const target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
      filter: (s) => (s.structureType === STRUCTURE_SPAWN || 
                      s.structureType === STRUCTURE_EXTENSION || 
                      s.structureType === STRUCTURE_TOWER) && 
                     s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });

    if (target) {
      if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        CreepLogic.moveTo(creep, target);
      }
    }
  }
}

import CreepLogic from "../creeps/creep.logic";

/**
 * Task: Deliver
 * Persistent energy delivery logic.
 */
export default class TaskDeliver {
  public static run(creep: Creep): void {
    let targetId = creep.memory.targetId as Id<AnyStoreStructure>;
    let target = Game.getObjectById(targetId);

    // Clear target if full or gone
    if (!target || !('store' in target) || target.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.targetId = undefined;

      const newTarget = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
        filter: (s): s is AnyStoreStructure => 
          (s.structureType === STRUCTURE_SPAWN || 
           s.structureType === STRUCTURE_EXTENSION || 
           s.structureType === STRUCTURE_TOWER) && 
           s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      });

      if (newTarget) {
        targetId = newTarget.id;
        target = newTarget;
        creep.memory.targetId = targetId;
      }
    }

    if (target) {
      if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        CreepLogic.moveTo(creep, target);
      }
    }
  }
}

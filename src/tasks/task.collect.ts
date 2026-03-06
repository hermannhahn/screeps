import CreepLogic from "../creeps/creep.logic";

/**
 * Task: Collect
 * Persistent energy collection logic.
 */
export default class TaskCollect {
  public static run(creep: Creep): void {
    let targetId = creep.memory.targetId as Id<Resource | StructureContainer>;
    let target = Game.getObjectById(targetId);

    // If no persistent target or target is gone/invalid
    if (!target || (target instanceof StructureContainer && target.store[RESOURCE_ENERGY] === 0)) {
      creep.memory.targetId = undefined;

      // 1. Find Nearest Drop
      const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
        filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= 50
      });

      if (dropped) {
        targetId = dropped.id as any;
        target = dropped as any;
      } else {
        // 2. Find Nearest Container
        const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] >= 100
        });

        if (container) {
          targetId = container.id as any;
          target = container as any;
        }
      }
      
      if (targetId) creep.memory.targetId = targetId;
    }

    if (target) {
      const action = (target instanceof Resource) ? creep.pickup(target) : creep.withdraw(target, RESOURCE_ENERGY);
      if (action === ERR_NOT_IN_RANGE) {
        CreepLogic.moveTo(creep, target);
      }
    }
  }
}

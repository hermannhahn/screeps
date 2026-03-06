import CreepLogic from "../creeps/creep.logic";

/**
 * Task: Collect
 * Picks up energy from drops or withdraws from containers.
 */
export default class TaskCollect {
  public static run(creep: Creep): void {
    // 1. Priority: Nearest Drops
    const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
      filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= 50
    });

    if (dropped) {
      if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
        CreepLogic.moveTo(creep, dropped);
      }
      return;
    }

    // 2. Priority: Containers (Exit then Source)
    const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] >= 100
    });

    if (container) {
      if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        CreepLogic.moveTo(creep, container);
      }
    }
  }
}

import CreepLogic from "../creeps/creep.logic";

/**
 * Role: Supplier
 * Logistics logic for energy distribution.
 */
export default class RoleSupplier {
  public static run(creep: Creep): void {
    CreepLogic.updateState(creep);

    if (creep.memory.working) {
      // Priority: Fill Spawn and Extensions
      let target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
        filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && 
                       s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      });

      if (target) {
        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          CreepLogic.moveTo(creep, target);
        }
      }
    } else {
      // Find dropped energy or containers
      const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
        filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount > 20
      });

      if (dropped) {
        if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
          CreepLogic.moveTo(creep, dropped);
        }
      }
    }
  }
}

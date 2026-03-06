import CreepLogic from "../creeps/creep.logic";
import TaskCollect from "../tasks/task.collect";
import TaskDeliver from "../tasks/task.deliver";
import TaskRepair from "../tasks/task.repair";
import TaskUpgrade from "../tasks/task.upgrade";
import TaskHarvest from "../tasks/task.harvest";

/**
 * Role: Supplier
 * Logistics and energy distribution with fallbacks.
 */
export default class RoleSupplier {
  public static run(creep: Creep): void {
    CreepLogic.updateState(creep);

    if (creep.memory.working) {
      // Primary: Deliver
      const target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
        filter: (s) => (s.structureType === STRUCTURE_SPAWN || 
                        s.structureType === STRUCTURE_EXTENSION || 
                        s.structureType === STRUCTURE_TOWER) && 
                       s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      });

      if (target) {
        TaskDeliver.run(creep);
      } else {
        // Fallbacks
        const repairTarget = creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (s) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL
        });

        if (repairTarget) {
          TaskRepair.run(creep);
        } else {
          TaskUpgrade.run(creep);
        }
      }
    } else {
      // Collect energy, fallback to harvest
      const dropped = creep.room.find(FIND_DROPPED_RESOURCES, {
        filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= 50
      });

      if (dropped.length > 0) {
        TaskCollect.run(creep);
      } else {
        TaskHarvest.run(creep);
      }
    }
  }
}

import CreepLogic from "../creeps/creep.logic";
import TaskCollect from "../tasks/task.collect";
import TaskDeliver from "../tasks/task.deliver";
import TaskRepair from "../tasks/task.repair";
import TaskUpgrade from "../tasks/task.upgrade";
import TaskHarvest from "../tasks/task.harvest";

/**
 * Role: Supplier
 * Logistics logic with stable target persistence.
 */
export default class RoleSupplier {
  public static run(creep: Creep): void {
    CreepLogic.updateState(creep);

    if (creep.memory.working) {
      // If we have a targetId, it must be for delivery
      if (creep.memory.targetId) {
        TaskDeliver.run(creep);
      } else {
        // Decide what to do: Deliver -> Repair -> Upgrade
        const deliveryTarget = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
          filter: (s) => (s.structureType === STRUCTURE_SPAWN || 
                          s.structureType === STRUCTURE_EXTENSION || 
                          s.structureType === STRUCTURE_TOWER) && 
                         s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        if (deliveryTarget) {
          TaskDeliver.run(creep);
        } else {
          const repairTarget = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL
          });
          if (repairTarget) {
            TaskRepair.run(creep);
          } else {
            TaskUpgrade.run(creep);
          }
        }
      }
    } else {
      // Energy collection phase
      if (creep.memory.targetId) {
        const target = Game.getObjectById(creep.memory.targetId as Id<any>);
        // If the persistent target is a source, keep harvesting
        if (target instanceof Source) {
          TaskHarvest.run(creep);
        } else {
          // Otherwise it's a drop or container
          TaskCollect.run(creep);
        }
      } else {
        // No target, find one based on priority: Drops -> Containers -> Harvest
        const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
          filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= 50
        });

        if (dropped) {
          TaskCollect.run(creep);
        } else {
          const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] >= 100
          });
          if (container) {
            TaskCollect.run(creep);
          } else {
            TaskHarvest.run(creep);
          }
        }
      }
    }
  }
}

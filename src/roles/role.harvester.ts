import CreepLogic from "../creeps/creep.logic";
import TaskHarvest from "../tasks/task.harvest";
import TaskDeliver from "../tasks/task.deliver";

/**
 * Role: Harvester
 * Static mining with optimized delivery priority.
 */
export default class RoleHarvester {
  public static run(creep: Creep): void {
    CreepLogic.updateState(creep);

    if (creep.memory.working) {
      const suppliers = creep.room.find(FIND_MY_CREEPS, {
        filter: (c) => c.memory.role === 'supplier'
      });

      // Emergency delivery if no suppliers
      if (suppliers.length === 0) {
        TaskDeliver.run(creep);
      } else {
        // Optimized delivery: Link -> Container -> Drop (all within range 3)
        const closeStructure = creep.pos.findInRange(FIND_STRUCTURES, 3, {
          filter: (s) => (s.structureType === STRUCTURE_LINK || s.structureType === STRUCTURE_CONTAINER) &&
                         s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        })[0];

        if (closeStructure) {
          if (creep.transfer(closeStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            CreepLogic.moveTo(creep, closeStructure);
          }
        } else {
          // Fallback: Just drop it
          creep.drop(RESOURCE_ENERGY);
        }
      }
    } else {
      TaskHarvest.run(creep);
    }
  }
}

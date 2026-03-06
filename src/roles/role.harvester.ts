import CreepLogic from "../creeps/creep.logic";
import TaskHarvest from "../tasks/task.harvest";
import TaskDeliver from "../tasks/task.deliver";
import ToolUtils from "../tools/tool.utils";

/**
 * Role: Harvester
 * Static mining with strict target persistence.
 * Assigns a source ID for its entire lifetime.
 */
export default class RoleHarvester {
  public static run(creep: Creep): void {
    CreepLogic.updateState(creep);

    if (creep.memory.working) {
      // 1. If no targetId, search for a delivery target
      if (!creep.memory.targetId) {
        const suppliers = creep.room.find(FIND_MY_CREEPS, {
          filter: (c) => c.memory.role === 'supplier'
        });

        // Emergency delivery if no suppliers
        if (suppliers.length === 0) {
          const target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: (s) => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
                           s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
          });
          if (target) creep.memory.targetId = target.id;
        } else {
          // Optimized delivery: Link -> Container (within range 3)
          const closeStructure = creep.pos.findInRange(FIND_STRUCTURES, 3, {
            filter: (s) => (s.structureType === STRUCTURE_LINK || s.structureType === STRUCTURE_CONTAINER) &&
                           s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
          })[0];

          if (closeStructure) {
            creep.memory.targetId = closeStructure.id;
          } else {
            // No structure, just drop. We don't need a targetId for dropping.
            creep.drop(RESOURCE_ENERGY);
          }
        }
      }

      // 2. Execute delivery if targetId exists
      if (creep.memory.targetId) {
        TaskDeliver.run(creep);
      }
    } else {
      // 1. If no targetId, find a free source
      if (!creep.memory.targetId) {
        const extensionCount = creep.room.find(FIND_MY_STRUCTURES, {
          filter: { structureType: STRUCTURE_EXTENSION }
        }).length;
        const maxPerSource = extensionCount >= 5 ? 1 : 2;

        // SAFETY: Only consider safe sources (10-block range)
        const sources = ToolUtils.getSafeSources(creep.room);
        for (const source of sources) {
          const assignedCreeps = creep.room.find(FIND_MY_CREEPS, {
            filter: (c) => c.memory.role === 'harvester' && c.memory.targetId === source.id
          });

          if (assignedCreeps.length < maxPerSource) {
            creep.memory.targetId = source.id;
            break;
          }
        }
      }

      // 2. Execute harvest
      if (creep.memory.targetId) {
        TaskHarvest.run(creep);
      }
    }
  }
}

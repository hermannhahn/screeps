import CreepLogic from "../creeps/creep.logic";
import TaskCollect from "../tasks/task.collect";
import TaskDeliver from "../tasks/task.deliver";
import TaskRepair from "../tasks/task.repair";
import TaskUpgrade from "../tasks/task.upgrade";
import TaskHarvest from "../tasks/task.harvest";

/**
 * Role: Supplier
 * Logistics logic with strict target persistence.
 * Collects ONLY from Drops and Source Containers.
 * Delivers to Spawns, Extensions, Towers, and Non-Source Containers.
 */
export default class RoleSupplier {
  public static run(creep: Creep): void {
    CreepLogic.updateState(creep);

    if (creep.memory.working) {
      // 1. If no targetId, search for delivery targets
      if (!creep.memory.targetId) {
        // PRIORITY 1: Spawns, Extensions, and Towers
        const primaryTarget = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
          filter: (s) => (s.structureType === STRUCTURE_SPAWN || 
                          s.structureType === STRUCTURE_EXTENSION || 
                          s.structureType === STRUCTURE_TOWER) && 
                         s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        if (primaryTarget) {
          creep.memory.targetId = primaryTarget.id;
        } else {
          // PRIORITY 2: Non-Source Containers (e.g., Controller or Exit containers)
          const logisticsTarget = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_CONTAINER && 
                           s.pos.findInRange(FIND_SOURCES, 1).length === 0 && // MUST NOT be near a source
                           s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
          });

          if (logisticsTarget) {
            creep.memory.targetId = logisticsTarget.id;
          } else {
            // FALLBACK: Repair or Upgrade
            const repairTarget = creep.pos.findClosestByRange(FIND_STRUCTURES, {
              filter: (s) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL
            });
            if (repairTarget) {
              creep.memory.targetId = repairTarget.id;
            } else if (creep.room.controller) {
              creep.memory.targetId = creep.room.controller.id;
            }
          }
        }
      }

      // 2. Execute based on targetId (Task handles validation and clearing)
      if (creep.memory.targetId) {
        const target = Game.getObjectById(creep.memory.targetId as Id<any>);
        if (target instanceof StructureController) TaskUpgrade.run(creep);
        else if (target instanceof StructureTower || target instanceof StructureSpawn || 
                 target instanceof StructureExtension || target instanceof StructureContainer) TaskDeliver.run(creep);
        else TaskRepair.run(creep);
      }
    } else {
      // 1. If no targetId, search for energy collection
      if (!creep.memory.targetId) {
        // Priority 1: Drops
        const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
          filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= 20
        });

        if (dropped) {
          creep.memory.targetId = dropped.id;
        } else {
          // Priority 2: Source Containers ONLY
          const sourceContainer = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_CONTAINER && 
                           s.pos.findInRange(FIND_SOURCES, 1).length > 0 && // MUST be near a source
                           s.store[RESOURCE_ENERGY] >= 50
          });
          
          if (sourceContainer) {
            creep.memory.targetId = sourceContainer.id;
          } else {
            // Priority 3: Manual Harvest (if no harvesters)
            const harvesters = creep.room.find(FIND_MY_CREEPS, { filter: (c) => c.memory.role === 'harvester' });
            if (harvesters.length === 0) {
              const source = creep.pos.findClosestByRange(FIND_SOURCES);
              if (source) creep.memory.targetId = source.id;
            }
          }
        }
      }

      // 2. Execute based on targetId (Task handles validation and clearing)
      if (creep.memory.targetId) {
        const target = Game.getObjectById(creep.memory.targetId as Id<any>);
        if (target instanceof Source) TaskHarvest.run(creep);
        else TaskCollect.run(creep);
      }
    }
  }
}

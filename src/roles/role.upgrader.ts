import CreepLogic from "../creeps/creep.logic";
import TaskCollect from "../tasks/task.collect";
import TaskUpgrade from "../tasks/task.upgrade";
import TaskHarvest from "../tasks/task.harvest";

/**
 * Role: Upgrader
 * Controller progression with strict target persistence.
 */
export default class RoleUpgrader {
  public static run(creep: Creep): void {
    CreepLogic.updateState(creep);

    if (creep.memory.working) {
      // 1. If no targetId, search for the controller
      if (!creep.memory.targetId && creep.room.controller) {
        creep.memory.targetId = creep.room.controller.id;
      }

      // 2. Execute upgrade
      if (creep.memory.targetId) {
        const target = Game.getObjectById(creep.memory.targetId as Id<any>);
        if (target instanceof StructureController) TaskUpgrade.run(creep);
        else creep.memory.targetId = undefined;
      }
    } else {
      // 1. If no targetId, search for energy collection
      if (!creep.memory.targetId) {
        // Priority 1: Controller Container (Near Controller)
        const controller = creep.room.controller;
        if (controller) {
          const container = controller.pos.findInRange(FIND_STRUCTURES, 3, {
            filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] >= 100
          })[0];
          if (container) {
            creep.memory.targetId = container.id;
          }
        }

        if (!creep.memory.targetId) {
          // Priority 2: Drops
          const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
            filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= 50
          });
          if (dropped) {
            creep.memory.targetId = dropped.id;
          } else {
            // Priority 3: Storage (if high energy)
            if (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 1000) {
              creep.memory.targetId = creep.room.storage.id;
            } else {
              // Priority 4: Any other container
              const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] >= 100
              });
              if (container) {
                creep.memory.targetId = container.id;
              } else {
                // Priority 5: Emergency Harvest
                if (creep.room.find(FIND_MY_CREEPS, { filter: (c) => c.memory.role === 'harvester' }).length === 0) {
                  const source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
                  if (source) creep.memory.targetId = source.id;
                }
              }
            }
          }
        }
      }

      // 2. Execute collection/harvest
      if (creep.memory.targetId) {
        const target = Game.getObjectById(creep.memory.targetId as Id<any>);
        if (target instanceof Source) TaskHarvest.run(creep);
        else if (target instanceof Structure || target instanceof Resource) TaskCollect.run(creep);
        else creep.memory.targetId = undefined;
      }
    }
  }
}

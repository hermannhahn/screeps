import CreepLogic from "../creeps/creep.logic";
import TaskBuild from "../tasks/task.build";
import TaskRepair from "../tasks/task.repair";
import TaskUpgrade from "../tasks/task.upgrade";
import TaskCollect from "../tasks/task.collect";
import TaskHarvest from "../tasks/task.harvest";

/**
 * Role: Worker
 * General maintenance role with strict target persistence.
 */
export default class RoleWorker {
  public static run(creep: Creep): void {
    CreepLogic.updateState(creep);

    if (creep.memory.working) {
      // 1. If no targetId, search for a work target (Build -> Repair -> Upgrade)
      if (!creep.memory.targetId) {
        const buildSite = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
        if (buildSite) {
          creep.memory.targetId = buildSite.id;
        } else {
          const repairTarget = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL
          });
          if (repairTarget) {
            creep.memory.targetId = repairTarget.id;
          } else {
            if (creep.room.controller) creep.memory.targetId = creep.room.controller.id;
          }
        }
      }

      // 2. Execute based on targetId (Task handles validation and clearing)
      if (creep.memory.targetId) {
        const target = Game.getObjectById(creep.memory.targetId as Id<any>);
        if (target instanceof ConstructionSite) TaskBuild.run(creep);
        else if (target instanceof StructureController) TaskUpgrade.run(creep);
        else if (target instanceof Structure) TaskRepair.run(creep);
        else creep.memory.targetId = undefined; // CLEAR if target is wrong type
      }
    } else {
      // 1. If no targetId, search for energy
      if (!creep.memory.targetId) {
        // A. Seek dropped energy first
        const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
          filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= 50
        });

        if (dropped) {
          creep.memory.targetId = dropped.id;
        } else {
          // B. Seek containers
          const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] >= 50
          });
          if (container) {
            creep.memory.targetId = container.id;
          } else {
            // C. EMERGENCY: Harvest directly if no resources available
            const source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
            if (source) creep.memory.targetId = source.id;
          }
        }
      }

      // 2. Execute based on targetId (Task handles validation and clearing)
      if (creep.memory.targetId) {
        const target = Game.getObjectById(creep.memory.targetId as Id<any>);
        if (target instanceof Source) TaskHarvest.run(creep);
        else if (target instanceof Structure || target instanceof Resource) TaskCollect.run(creep);
        else creep.memory.targetId = undefined; // CLEAR if target is wrong type
      }
    }
  }
}

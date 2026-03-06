import CreepLogic from "../creeps/creep.logic";
import TaskBuild from "../tasks/task.build";
import TaskRepair from "../tasks/task.repair";
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
      // 1. If no targetId, search for a work target (Build -> Repair)
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
          }
        }
      }

      // 2. Execute based on targetId (Task handles validation and clearing)
      if (creep.memory.targetId) {
        const target = Game.getObjectById(creep.memory.targetId as Id<any>);
        if (target instanceof ConstructionSite) TaskBuild.run(creep);
        else if (target instanceof Structure) TaskRepair.run(creep);
      }
    } else {
      // 1. If no targetId, search for energy
      if (!creep.memory.targetId) {
        const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
          filter: (r) => r.resourceType === RESOURCE_ENERGY && r.amount >= 50
        });

        if (dropped) {
          creep.memory.targetId = dropped.id;
        } else {
          const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] >= 50
          });
          if (container) {
            creep.memory.targetId = container.id;
          } else {
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

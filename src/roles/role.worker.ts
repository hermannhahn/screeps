import CreepLogic from "../creeps/creep.logic";

/**
 * Role: Worker
 * Builds and repairs structures.
 */
export default class RoleWorker {
  public static run(creep: Creep): void {
    CreepLogic.updateState(creep);

    if (creep.memory.working) {
      // Priority: Build then Repair
      const targets = creep.room.find(FIND_CONSTRUCTION_SITES);
      if (targets.length > 0) {
        if (creep.build(targets[0]) === ERR_NOT_IN_RANGE) {
          CreepLogic.moveTo(creep, targets[0]);
        }
      } else {
        const repairTarget = creep.room.find(FIND_STRUCTURES, {
          filter: (s) => s.hits < s.hitsMax
        })[0];
        if (repairTarget) {
          if (creep.repair(repairTarget) === ERR_NOT_IN_RANGE) {
            CreepLogic.moveTo(creep, repairTarget);
          }
        }
      }
    } else {
      const sources = creep.room.find(FIND_SOURCES);
      if (creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
        CreepLogic.moveTo(creep, sources[0]);
      }
    }
  }
}

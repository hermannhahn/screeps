import CreepLogic from "../creeps/creep.logic";

/**
 * Role: Harvester
 * Static mining logic.
 */
export default class RoleHarvester {
  public static run(creep: Creep): void {
    // If we don't have a source assigned, find one from room memory
    if (!creep.memory.targetId && creep.room.memory.sources) {
      creep.memory.targetId = creep.room.memory.sources[0]; // Simple assignment for now
    }

    const source = Game.getObjectById(creep.memory.targetId as Id<Source>);
    
    if (source) {
      if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        CreepLogic.moveTo(creep, source);
      }
    }
  }
}

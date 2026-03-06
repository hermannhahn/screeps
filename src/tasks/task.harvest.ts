import CreepLogic from "../creeps/creep.logic";

/**
 * Task: Harvest
 * Finds an available source and harvests energy.
 */
export default class TaskHarvest {
  public static run(creep: Creep): void {
    let sourceId = creep.memory.targetId as Id<Source>;

    if (!sourceId) {
      const sources = creep.room.find(FIND_SOURCES);
      // Find source with fewer than 2 harvesters (or 1 if 5+ extensions)
      const maxMiners = creep.room.find(FIND_MY_STRUCTURES, {
        filter: { structureType: STRUCTURE_EXTENSION }
      }).length >= 5 ? 1 : 2;

      for (const source of sources) {
        const miners = creep.room.find(FIND_MY_CREEPS, {
          filter: (c) => c.memory.role === 'harvester' && c.memory.targetId === source.id
        });
        if (miners.length < maxMiners) {
          sourceId = source.id;
          creep.memory.targetId = sourceId;
          break;
        }
      }
    }

    const source = Game.getObjectById(sourceId);
    if (source) {
      if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        CreepLogic.moveTo(creep, source);
      }
    }
  }
}

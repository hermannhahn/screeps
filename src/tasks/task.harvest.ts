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
      
      // Calculate max allowed creeps per source (2 initially, 1 if 5+ extensions)
      const extensionCount = creep.room.find(FIND_MY_STRUCTURES, {
        filter: { structureType: STRUCTURE_EXTENSION }
      }).length;
      const maxPerSource = extensionCount >= 5 ? 1 : 2;

      for (const source of sources) {
        // Count ANY creep that has this source as its targetId
        const assignedCreeps = creep.room.find(FIND_MY_CREEPS, {
          filter: (c) => c.memory.targetId === source.id
        });

        if (assignedCreeps.length < maxPerSource) {
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

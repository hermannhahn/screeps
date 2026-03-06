import CreepLogic from "../creeps/creep.logic";

/**
 * Task: Harvest
 * Finds an available source and harvests energy.
 */
export default class TaskHarvest {
  public static run(creep: Creep): void {
    let sourceId = creep.memory.targetId as Id<Source>;
    const isHarvester = creep.memory.role === 'harvester';

    // Calculate max allowed creeps per source (2 initially, 1 if 5+ extensions)
    const extensionCount = creep.room.find(FIND_MY_STRUCTURES, {
      filter: { structureType: STRUCTURE_EXTENSION }
    }).length;
    const maxPerSource = extensionCount >= 5 ? 1 : 2;

    // Harvesters keep their sourceId forever. Other roles can change to the closest free source.
    if (!sourceId || !isHarvester) {
      const sources = creep.room.find(FIND_SOURCES);
      
      // Sort sources by range for non-harvesters
      if (!isHarvester) {
        sources.sort((a, b) => creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b));
      }

      for (const source of sources) {
        // Safety check: Avoid sources near enemies (within range 10)
        const hostiles = source.pos.findInRange(FIND_HOSTILE_CREEPS, 10).length > 0 ||
                         source.pos.findInRange(FIND_HOSTILE_STRUCTURES, 10).length > 0;
        
        if (hostiles) continue;

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
    } else {
      creep.memory.targetId = undefined;
    }
  }
}

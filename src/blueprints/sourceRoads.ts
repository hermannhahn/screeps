import { Blueprint } from './blueprintInterface';
import { planRoadFromTo, isSafePosition, isRoadPathComplete } from './utils'; // This function will be added to utils.ts

const sourceRoadsBlueprint: Blueprint = {
    name: "Source Roads",

    plan: function(room: Room, spawn: StructureSpawn): number {
        const sources = room.find(FIND_SOURCES);
        let sitesCreated = 0;
        for (const source of sources) {
            if (!isSafePosition(source.pos)) {
                console.log(`[ManagerPlanner] Source at ${source.pos} is not safe. Skipping road planning.`);
                continue;
            }
            sitesCreated += planRoadFromTo(room, source.pos, spawn.pos);
        }
        return sitesCreated;
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        const sources = room.find(FIND_SOURCES);
        for (const source of sources) {
            if (!isRoadPathComplete(room, source.pos, spawn.pos)) {
                return false;
            }
        }
        return true; // All source paths are complete
    }
};

export default sourceRoadsBlueprint;

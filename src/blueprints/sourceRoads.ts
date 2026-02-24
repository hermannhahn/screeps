import { Blueprint } from './blueprintInterface';
import { planRoadFromTo, isSafePosition } from './utils'; // This function will be added to utils.ts

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
            const path = room.findPath(source.pos, spawn.pos, {
                ignoreCreeps: true, swampCost: 1, plainCost: 1, maxOps: 2000
            });
            // Check if every segment of the path has a road structure or construction site
            const pathIsComplete = path.every(segment => {
                const pos = room.getPositionAt(segment.x, segment.y);
                if (!pos) return false; // Should not happen

                const hasRoad = pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_ROAD);
                const hasRoadCS = pos.lookFor(LOOK_CONSTRUCTION_SITES).some(cs => cs.structureType === STRUCTURE_ROAD);
                return hasRoad || hasRoadCS;
            });

            if (!pathIsComplete) {
                return false; // If any source path is incomplete, the blueprint is not complete
            }
        }
        return true; // All source paths are complete
    }
};

export default sourceRoadsBlueprint;

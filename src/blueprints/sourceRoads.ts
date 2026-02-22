import { Blueprint } from './blueprintInterface';
import { planRoadsFromToNearestRoad } from './utils';

const sourceRoadsBlueprint: Blueprint = {
    name: "Source Roads",

    plan: function(room: Room, spawn: StructureSpawn): number {
        const sources = room.find(FIND_SOURCES);
        let total = 0;
        for (const source of sources) {
            total += planRoadsFromToNearestRoad(room, source.pos);
        }
        return total;
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        const sourceRoadCS = room.find(FIND_SOURCES).some(source => {
            return source.pos.findInRange(FIND_CONSTRUCTION_SITES, 5, {
                filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_ROAD
            }).length > 0;
        });
        if (sourceRoadCS) return false;

        // More robust check needed: ensure all sources have a road leading to the base
        // For now, assuming no CS means it's complete enough
        return true;
    }
};

export default sourceRoadsBlueprint;

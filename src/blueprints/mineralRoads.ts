import { Blueprint } from './blueprintInterface';
import { planRoadsFromToNearestRoad } from './utils';

const mineralRoadsBlueprint: Blueprint = {
    name: "Mineral Roads",

    plan: function(room: Room, spawn: StructureSpawn): number {
        const mineral = room.find(FIND_MINERALS)[0];
        if (!mineral) return 0;
        return planRoadsFromToNearestRoad(room, mineral.pos);
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        const mineral = room.find(FIND_MINERALS)[0];
        if (!mineral) return true; // No mineral, so blueprint is "complete"

        // Check for construction sites for roads near the mineral
        const mineralRoadCS = mineral.pos.findInRange(FIND_CONSTRUCTION_SITES, 5, {
            filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_ROAD
        }).length > 0;
        if (mineralRoadCS) return false;

        // More robust check: verify road connection from mineral to nearest road
        // For simplicity, for now, assuming no CS means complete enough
        return true;
    }
};

export default mineralRoadsBlueprint;

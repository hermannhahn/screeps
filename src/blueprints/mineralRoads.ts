import { Blueprint } from './blueprintInterface';
import { planRoadsFromToNearestRoad, isSafePosition, isRoadPathComplete } from './utils';

const mineralRoadsBlueprint: Blueprint = {
    name: "Mineral Roads",

    plan: function(room: Room, spawn: StructureSpawn): number {
        const mineral = room.find(FIND_MINERALS)[0];
        if (!mineral || !isSafePosition(mineral.pos)) return 0;
        return planRoadsFromToNearestRoad(room, mineral.pos);
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        const mineral = room.find(FIND_MINERALS)[0];
        if (!mineral) return true; // No mineral, so blueprint is "complete"

        // Find existing roads or sites
        const roads = room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_ROAD
        }).concat(room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_ROAD
        } as any) as any);

        if (roads.length === 0) return false;

        const nearestRoad = mineral.pos.findClosestByPath(roads);
        if (!nearestRoad) return false;

        return isRoadPathComplete(room, mineral.pos, nearestRoad.pos);
    }
};

export default mineralRoadsBlueprint;

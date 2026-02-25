import { Blueprint } from './blueprintInterface';
import { planRoadsFromToNearestRoad, isSafePosition, isRoadPathComplete } from './utils'; // Import the helper function

const controllerRoadsBlueprint: Blueprint = {
    name: "Controller Roads",

    plan: function(room: Room, spawn: StructureSpawn): number {
        if (!room.controller || !isSafePosition(room.controller.pos)) return 0;
        return planRoadsFromToNearestRoad(room, room.controller.pos);
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        if (!room.controller) return true; // No controller
        
        // Find existing roads or sites
        const roads = room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_ROAD
        }).concat(room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_ROAD
        } as any) as any);

        if (roads.length === 0) return false;

        const nearestRoad = room.controller.pos.findClosestByPath(roads);
        if (!nearestRoad) return false;

        return isRoadPathComplete(room, room.controller.pos, nearestRoad.pos);
    }
};

export default controllerRoadsBlueprint;

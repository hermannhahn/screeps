import { Blueprint } from './blueprintInterface';
import { planRoadsFromToNearestRoad } from './utils'; // Import the helper function

const controllerRoadsBlueprint: Blueprint = {
    name: "Controller Roads",

    plan: function(room: Room, spawn: StructureSpawn): number {
        if (!room.controller) return 0;
        return planRoadsFromToNearestRoad(room, room.controller.pos);
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        if (!room.controller) return true; // No controller
        const controllerRoadCS = room.controller.pos.findInRange(FIND_CONSTRUCTION_SITES, 5, {
            filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_ROAD
        }).length > 0;
        if (controllerRoadCS) return false;

        // Check if controller has a road connection
        return true; // Placeholder, needs more robust check
    }
};

export default controllerRoadsBlueprint;

import { Blueprint } from './blueprintInterface';
import { planRoadsFromToNearestRoad, isSafePosition, isRoadPathComplete, findTargetForRoadConnection } from './utils'; // Import the helper function

const controllerRoadsBlueprint: Blueprint = {
    name: "Controller Roads",

    plan: function(room: Room, spawn: StructureSpawn): number {
        if (!room.controller || !isSafePosition(room.controller.pos)) return 0;
        return planRoadsFromToNearestRoad(room, room.controller.pos);
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        if (!room.controller) return true; // No controller
        
        const targetPos = findTargetForRoadConnection(room, room.controller.pos);
        if (!targetPos) return true; // Cannot find a target, assume "complete" or not applicable

        return isRoadPathComplete(room, room.controller.pos, targetPos);
    }
};

export default controllerRoadsBlueprint;

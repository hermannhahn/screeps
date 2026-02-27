import { Blueprint } from './blueprintInterface';
import { planRoadsFromToNearestRoad, isSafePosition, isRoadPathComplete, findTargetForRoadConnection } from './utils';

const mineralRoadsBlueprint: Blueprint = {
    name: "Mineral Roads",

    plan: function(room: Room, spawn: StructureSpawn): number {
        if (!room.controller || room.controller.level < 6) return 0; // Only plan mineral roads at RCL 6+
        const mineral = room.find(FIND_MINERALS)[0];
        if (!mineral || !isSafePosition(mineral.pos)) return 0;
        return planRoadsFromToNearestRoad(room, mineral.pos);
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        if (!room.controller || room.controller.level < 6) return true; // Not applicable yet
        const mineral = room.find(FIND_MINERALS)[0];
        if (!mineral) return true; // No mineral, so blueprint is "complete"

        const targetPos = findTargetForRoadConnection(room, mineral.pos);
        if (!targetPos) return true; // Cannot find target, assume "complete"

        return isRoadPathComplete(room, mineral.pos, targetPos);
    }
};

export default mineralRoadsBlueprint;

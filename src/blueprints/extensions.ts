import { Blueprint } from './blueprintInterface';
import { isSafePosition } from './utils';

const extensionsBlueprint: Blueprint = {
    name: "Extensions",

    plan: function(room: Room, spawn: StructureSpawn): number {
        if (!room.controller || room.controller.level < 2) return 0;
        if (!isSafePosition(spawn.pos)) return 0; // If even the spawn isn't safe, don't plan extensions nearby

        let plannedCount = 0;
        let sitesCreated = 0;
        const maxExtensionsForRCL = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level];
        const targetCount = maxExtensionsForRCL;
        const minDistance = 2; // From original planExtensions

        const roads = room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_ROAD
        }).concat(room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_ROAD
        } as any) as any);

        if (roads.length === 0) return 0;

        for (const road of roads) {
            if (plannedCount >= targetCount) break;

            // Look for positions at exactly range 2 from the road
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    if (plannedCount >= targetCount) break;
                    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) continue; // Skip range 0 and 1

                    const x = road.pos.x + dx;
                    const y = road.pos.y + dy;
                    if (x < 1 || x > 48 || y < 1 || y > 48) continue;

                    const pos = new RoomPosition(x, y, room.name);
                    if (pos.getRangeTo(spawn.pos) < minDistance) continue;

                    if (room.getTerrain().get(x, y) === TERRAIN_MASK_WALL) continue;

                    // Check range 1 around this position for ANY structure or construction site
                    const structuresInRange1 = pos.findInRange(FIND_STRUCTURES, 1).length;
                    const sitesInRange1 = pos.findInRange(FIND_CONSTRUCTION_SITES, 1).length;

                    if (structuresInRange1 === 0 && sitesInRange1 === 0) {
                        if (room.createConstructionSite(x, y, STRUCTURE_EXTENSION) === OK) {
                            plannedCount++;
                            sitesCreated++;
                        }
                    }
                }
            }
        }
        return sitesCreated;
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        if (!room.controller || room.controller.level < 2) return true; // Not applicable or too early

        const builtExtensions = room.find(FIND_MY_STRUCTURES, {
            filter: (s: AnyStructure) => s.structureType === STRUCTURE_EXTENSION
        }).length;
        const extensionConstructionSites = room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_EXTENSION
        }).length;

        const maxExtensionsForRCL = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level];
        const targetExtensions = maxExtensionsForRCL;

        // Stage is considered complete if we have built or are building the target number of extensions
        return (builtExtensions + extensionConstructionSites) >= targetExtensions;
    }
};

export default extensionsBlueprint;

import { Blueprint } from './blueprintInterface';

const sourceContainersBlueprint: Blueprint = {
    name: "Source Containers",

    plan: function(room: Room, spawn: StructureSpawn): number {
        const sources = room.find(FIND_SOURCES);
        let sitesCreated = 0;

        for (const source of sources) {
            // Find a suitable position for the container 2 blocks away from the source
            // Prefer positions that are not walls or existing structures
            let foundPos: RoomPosition | null = null;
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    if (Math.abs(dx) === 2 || Math.abs(dy) === 2) { // Exactly 2 blocks away
                        const x = source.pos.x + dx;
                        const y = source.pos.y + dy;

                        if (x < 0 || x > 49 || y < 0 || y > 49) continue;
                        const pos = new RoomPosition(x, y, room.name);

                        const terrain = room.getTerrain().get(x, y);
                        if (terrain === TERRAIN_MASK_WALL) continue;

                        // Check if position is occupied by another structure or construction site
                        const structures = pos.lookFor(LOOK_STRUCTURES);
                        if (structures.length > 0) continue;
                        const constructionSites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
                        if (constructionSites.length > 0) continue;

                        foundPos = pos;
                        break;
                    }
                }
                if (foundPos) break;
            }

            if (foundPos) {
                if (room.createConstructionSite(foundPos, STRUCTURE_CONTAINER) === OK) {
                    sitesCreated++;
                }
            }
        }
        return sitesCreated;
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        const sources = room.find(FIND_SOURCES);
        for (const source of sources) {
            // Check if there's a container (or CS) within 3 blocks of the source
            const containerOrCS = source.pos.findInRange(FIND_STRUCTURES, 3, {
                filter: (s) => s.structureType === STRUCTURE_CONTAINER
            }).length > 0 || source.pos.findInRange(FIND_CONSTRUCTION_SITES, 3, {
                filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_CONTAINER
            }).length > 0;

            if (!containerOrCS) {
                return false; // Missing container for this source
            }
        }
        return true; // All sources have a container/CS nearby
    }
};

export default sourceContainersBlueprint;

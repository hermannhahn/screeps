import { Blueprint } from './blueprintInterface';
import { findSourceContainer, isSafePosition } from './utils'; // New import

const sourceContainersBlueprint: Blueprint = {
    name: "Source Containers",

    plan: function(room: Room, spawn: StructureSpawn): number {
        const sources = room.find(FIND_SOURCES);
        let sitesCreated = 0;

        for (const source of sources) {
            // Check if a container (or CS) already exists near this source
            if (findSourceContainer(source)) {
                continue; // Skip this source if a container already exists or is planned
            }

            // Check if the source is safe (no enemies nearby)
            if (!isSafePosition(source.pos)) {
                console.log(`[ManagerPlanner] Source at ${source.pos} is not safe. Skipping container planning.`);
                continue;
            }

            // Find a suitable position for the container up to 2 blocks away from the source
            // Containers are very high priority, so we search range 1 then range 2.
            let foundPos: RoomPosition | null = null;
            for (let range = 1; range <= 2; range++) {
                for (let dx = -range; dx <= range; dx++) {
                    for (let dy = -range; dy <= range; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        if (Math.abs(dx) < range && Math.abs(dy) < range && range > 1) continue; // Already checked inner range

                        const x = source.pos.x + dx;
                        const y = source.pos.y + dy;

                        if (x < 0 || x > 49 || y < 0 || y > 49) continue;
                        const pos = new RoomPosition(x, y, room.name);

                        if (room.getTerrain().get(x, y) === TERRAIN_MASK_WALL) continue;

                        // Check if position is occupied by another structure (ignore roads)
                        const structures = pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType !== STRUCTURE_ROAD);
                        if (structures.length > 0) continue;
                        
                        const constructionSites = pos.lookFor(LOOK_CONSTRUCTION_SITES).filter(cs => cs.structureType !== STRUCTURE_ROAD);
                        if (constructionSites.length > 0) continue;

                        foundPos = pos;
                        break;
                    }
                    if (foundPos) break;
                }
                if (foundPos) break;
            }

            if (foundPos) {
                if (room.createConstructionSite(foundPos, STRUCTURE_CONTAINER) === OK) {
                    console.log(`[ManagerPlanner] Created Source Container CS at ${foundPos}`);
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

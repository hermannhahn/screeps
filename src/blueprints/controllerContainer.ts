import { Blueprint } from './blueprintInterface';
import { isSafePosition } from './utils';

const controllerContainerBlueprint: Blueprint = {
    name: "Controller Container",

    plan: function(room: Room, spawn: StructureSpawn): number {
        if (!room.controller || !isSafePosition(room.controller.pos)) return 0;

        // Check if a container already exists or is planned near the controller
        const existingContainer = room.controller.pos.findInRange(FIND_STRUCTURES, 3, {
            filter: (s) => s.structureType === STRUCTURE_CONTAINER
        });
        const existingCS = room.controller.pos.findInRange(FIND_CONSTRUCTION_SITES, 3, {
            filter: (cs) => cs.structureType === STRUCTURE_CONTAINER
        });

        if (existingContainer.length > 0 || existingCS.length > 0) {
            return 0;
        }

        // Find a suitable position for the container 2-3 blocks away from the controller
        // This gives space for upgraders to stand near the controller
        let foundPos: RoomPosition | null = null;
        for (let r = 2; r <= 3; r++) {
            for (let dx = -r; dx <= r; dx++) {
                for (let dy = -r; dy <= r; dy++) {
                    if (Math.abs(dx) < r && Math.abs(dy) < r) continue; // Only check the outer ring of the current radius
                    
                    const x = room.controller.pos.x + dx;
                    const y = room.controller.pos.y + dy;

                    if (x < 2 || x > 47 || y < 2 || y > 47) continue;
                    const pos = new RoomPosition(x, y, room.name);

                    const terrain = room.getTerrain().get(x, y);
                    if (terrain === TERRAIN_MASK_WALL) continue;

                    // Check if position is occupied by another structure or construction site
                    const structures = pos.lookFor(LOOK_STRUCTURES);
                    if (structures.length > 0) continue;
                    const constructionSites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
                    if (constructionSites.length > 0) continue;

                    // Ensure there's a path to this position
                    const path = spawn.pos.findPathTo(pos, { ignoreCreeps: true });
                    if (path.length === 0) continue;

                    foundPos = pos;
                    break;
                }
                if (foundPos) break;
            }
            if (foundPos) break;
        }

        if (foundPos) {
            if (room.createConstructionSite(foundPos, STRUCTURE_CONTAINER) === OK) {
                console.log(`[ManagerPlanner] Planning Controller Container at ${foundPos}`);
                return 1;
            }
        }

        return 0;
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        if (!room.controller) return true;
        
        const containerOrCS = room.controller.pos.findInRange(FIND_STRUCTURES, 3, {
            filter: (s) => s.structureType === STRUCTURE_CONTAINER
        }).length > 0 || room.controller.pos.findInRange(FIND_CONSTRUCTION_SITES, 3, {
            filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_CONTAINER
        }).length > 0;

        return containerOrCS;
    }
};

export default controllerContainerBlueprint;

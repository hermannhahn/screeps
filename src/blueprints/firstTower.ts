import { Blueprint } from './blueprintInterface';

const firstTowerBlueprint: Blueprint = {
    name: "First Tower",

    plan: function(room: Room, spawn: StructureSpawn): number {
        // Check if a tower (or CS) already exists
        const existingTower = room.find(FIND_MY_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_TOWER
        }).length > 0;
        const existingTowerCS = room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_TOWER
        }).length > 0;

        if (existingTower || existingTowerCS) {
            return 0; // Tower already exists or is planned
        }

        let sitesCreated = 0;

        // Find a suitable road position near the spawn
        const roadsNearSpawn = spawn.pos.findInRange(FIND_STRUCTURES, 5, { // Search within 5 tiles of spawn
            filter: (s) => s.structureType === STRUCTURE_ROAD
        }) as StructureRoad[];

        if (roadsNearSpawn.length === 0) {
            return 0; // No roads near spawn to place the tower
        }

        // Try to place the tower 2 blocks away from a road
        let foundPos: RoomPosition | null = null;
        for (const road of roadsNearSpawn) {
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    if (Math.abs(dx) === 2 || Math.abs(dy) === 2) { // Exactly 2 blocks away from the road
                        const x = road.pos.x + dx;
                        const y = road.pos.y + dy;

                        if (x < 0 || x > 49 || y < 0 || y > 49) continue;
                        const pos = new RoomPosition(x, y, room.name);

                        // Ensure the position is not too close to the spawn (e.g., min 3 range)
                        if (pos.getRangeTo(spawn.pos) < 3) continue;

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
            if (foundPos) break;
        }

        if (foundPos) {
            if (room.createConstructionSite(foundPos, STRUCTURE_TOWER) === OK) {
                sitesCreated++;
            }
        }
        return sitesCreated;
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        // Check if at least one tower structure exists
        const existingTower = room.find(FIND_MY_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_TOWER
        }).length > 0;
        // Check if at least one tower construction site exists
        const existingTowerCS = room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_TOWER
        }).length > 0;

        return existingTower && !existingTowerCS; // Complete if at least one tower is built and no CS for towers
    }
};

export default firstTowerBlueprint;

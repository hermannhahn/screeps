import { Blueprint } from './blueprintInterface';
import { isSafePosition } from './utils';

const spawnRoads: Blueprint = {
    name: "Spawn Roads",

    plan: function(room: Room, spawn: StructureSpawn): number {
        if (!isSafePosition(spawn.pos)) return 0;
        let sitesCreated = 0;
        const distance = 1; // From original planRoadRing
        const centerPos = spawn.pos;

        for (let x = centerPos.x - distance; x <= centerPos.x + distance; x++) {
            for (let y = centerPos.y - distance; y <= centerPos.y + distance; y++) {
                if (x === centerPos.x - distance || x === centerPos.x + distance ||
                    y === centerPos.y - distance || y === centerPos.y + distance) {
                    if (x < 0 || x > 49 || y < 0 || y > 49) continue;
                    const terrain = room.getTerrain().get(x, y);
                    if (terrain === TERRAIN_MASK_WALL) continue;
                    if (room.createConstructionSite(x, y, STRUCTURE_ROAD) === OK) {
                        sitesCreated++;
                    }
                }
            }
        }
        return sitesCreated;
    },

    isComplete: function(room: Room, spawn: StructureSpawn): boolean {
        let potentialRoads = 0;
        let existingRoadsOrCS = 0;

        for (let x = spawn.pos.x - 1; x <= spawn.pos.x + 1; x++) {
            for (let y = spawn.pos.y - 1; y <= spawn.pos.y + 1; y++) {
                if (x === spawn.pos.x && y === spawn.pos.y) continue;
                if (x < 0 || x > 49 || y < 0 || y > 49) continue;

                const terrain = room.getTerrain().get(x, y);
                if (terrain !== TERRAIN_MASK_WALL) {
                    potentialRoads++;
                    const pos = new RoomPosition(x, y, room.name);
                    const hasRoad = pos.lookFor(LOOK_STRUCTURES).some(s => s.structureType === STRUCTURE_ROAD);
                    const hasRoadCS = pos.lookFor(LOOK_CONSTRUCTION_SITES).some(cs => cs.structureType === STRUCTURE_ROAD);
                    if (hasRoad || hasRoadCS) {
                        existingRoadsOrCS++;
                    }
                }
            }
        }
        
        return existingRoadsOrCS >= potentialRoads;
    }
};

export default spawnRoads;

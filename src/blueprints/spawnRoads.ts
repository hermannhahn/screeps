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
        const roadConstructionSitesInRing = room.find(FIND_CONSTRUCTION_SITES, {
            filter: (cs: ConstructionSite) => cs.structureType === STRUCTURE_ROAD && cs.pos.getRangeTo(spawn.pos) <= 1
        }).length;
        const builtRoads = room.find(FIND_STRUCTURES, {
            filter: (s: AnyStructure) => s.structureType === STRUCTURE_ROAD && s.pos.getRangeTo(spawn.pos) <= 1
        }).length;
        
        return (builtRoads + roadConstructionSitesInRing) >= 8;
    }
};

export default spawnRoads;
